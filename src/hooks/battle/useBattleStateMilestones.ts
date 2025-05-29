import { useCallback } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";

export const useBattleStateMilestones = (
  finalRankings: RankedPokemon[],
  battleHistory: { battle: any[], selected: number[] }[],
  battlesCompleted: number,
  completionPercentage: number,
  setShowingMilestone: (showing: boolean) => void,
  setMilestoneInProgress: (inProgress: boolean) => void,
  setRankingGenerated: (generated: boolean) => void,
  setFinalRankings: (rankings: any) => void,
  startNewBattleWrapper: () => void
) => {
  const calculateCompletionPercentage = useCallback(() => {
    const completed = battlesCompleted;
    const totalPossible = 800;
    const percentage = Math.min((completed / totalPossible) * 100, 100);
    console.log(`🔧 [MILESTONE_CALC_DEBUG] Completion calculation: ${completed}/${totalPossible} = ${percentage}%`);
    return percentage;
  }, [battlesCompleted]);

  const getSnapshotForMilestone = useCallback(() => {
    const snapshot = {
      rankings: [...finalRankings],
      battleHistory: [...battleHistory],
      battlesCompleted,
      completionPercentage
    };
    console.log(`🔧 [MILESTONE_SNAPSHOT_DEBUG] Created snapshot with ${snapshot.rankings.length} rankings`);
    return JSON.stringify(snapshot);
  }, [finalRankings, battleHistory, battlesCompleted, completionPercentage]);

  // CRITICAL FIX: Actually generate rankings from battle history
  const generateRankings = useCallback(() => {
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] ===== GENERATING RANKINGS =====`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Current finalRankings length: ${finalRankings.length}`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] battleHistory length: ${battleHistory.length}`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] battlesCompleted: ${battlesCompleted}`);
    
    if (battleHistory.length === 0) {
      console.log(`🚨 [MILESTONE_RANKINGS_ULTRA_DEBUG] No battle history available to generate rankings from!`);
      return;
    }

    // CRITICAL FIX: Generate simple rankings from battle history
    const pokemonStats = new Map<number, { pokemon: any, wins: number, losses: number, battles: number }>();
    
    // Process battle history to count wins/losses
    battleHistory.forEach(({ battle, selected }) => {
      console.log(`🔧 [RANKING_GENERATION] Processing battle: ${battle.map(p => p.name).join(' vs ')}, selected: ${selected}`);
      
      battle.forEach(pokemon => {
        if (!pokemonStats.has(pokemon.id)) {
          pokemonStats.set(pokemon.id, {
            pokemon,
            wins: 0,
            losses: 0,
            battles: 0
          });
        }
        
        const stats = pokemonStats.get(pokemon.id)!;
        stats.battles++;
        
        if (selected.includes(pokemon.id)) {
          stats.wins++;
          console.log(`🏆 [RANKING_GENERATION] ${pokemon.name} won this battle`);
        } else {
          stats.losses++;
          console.log(`💔 [RANKING_GENERATION] ${pokemon.name} lost this battle`);
        }
      });
    });

    // Convert to ranked pokemon with scores
    const rankedPokemon: RankedPokemon[] = Array.from(pokemonStats.values())
      .map(({ pokemon, wins, losses, battles }) => {
        const winRate = battles > 0 ? wins / battles : 0;
        const score = winRate * 100 + (wins * 5); // Simple scoring system
        
        console.log(`🔧 [RANKING_GENERATION] ${pokemon.name}: ${wins}W/${losses}L (${(winRate * 100).toFixed(1)}% win rate), score: ${score.toFixed(1)}`);
        
        return {
          ...pokemon,
          score,
          count: battles,
          confidence: Math.min(battles * 10, 100), // Confidence increases with more battles
          wins,
          losses,
          winRate
        };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending

    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Generated ${rankedPokemon.length} rankings`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Top 5 Pokemon:`, rankedPokemon.slice(0, 5).map(p => `${p.name} (score: ${p.score.toFixed(1)})`));
    
    // CRITICAL FIX: Actually set the rankings!
    setFinalRankings(rankedPokemon);
    setRankingGenerated(true);
    
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] ===== END RANKING GENERATION =====`);
  }, [finalRankings, battleHistory, battlesCompleted, setRankingGenerated, setFinalRankings]);

  const handleSaveRankings = useCallback(() => {
    console.log(`🔧 [MILESTONE_SAVE_DEBUG] Saving rankings and hiding milestone`);
    setShowingMilestone(false);
  }, [setShowingMilestone]);

  const handleContinueBattles = useCallback(() => {
    console.log(`🔧 [MILESTONE_CONTINUE_DEBUG] ===== CONTINUING BATTLES =====`);
    console.log(`🔧 [MILESTONE_CONTINUE_DEBUG] Hiding milestone and starting new battle`);
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    startNewBattleWrapper();
    console.log(`🔧 [MILESTONE_CONTINUE_DEBUG] ===== END CONTINUE BATTLES =====`);
  }, [startNewBattleWrapper, setShowingMilestone, setMilestoneInProgress]);

  const resetMilestoneInProgress = useCallback(() => {
    console.log(`🔧 [MILESTONE_RESET_DEBUG] Resetting milestone in progress flag`);
    setMilestoneInProgress(false);
  }, [setMilestoneInProgress]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
    console.log(`🔧 [MILESTONE_SUGGEST_DEBUG] Suggesting ranking adjustment for ${pokemon.name}: ${direction} by ${strength}`);
    pokemon.suggestedAdjustment = { direction, strength, used: false };
    setFinalRankings(prev => {
      return prev.map(p => {
        if (p.id === pokemon.id) {
          return { ...p, suggestedAdjustment: pokemon.suggestedAdjustment };
        }
        return p;
      });
    });
  }, [setFinalRankings]);

  const removeSuggestion = useCallback((pokemonId: number) => {
    console.log(`🔧 [MILESTONE_REMOVE_DEBUG] Removing suggestion for Pokemon ${pokemonId}`);
    setFinalRankings(prev => {
      return prev.map(p => {
        if (p.id === pokemonId) {
          delete p.suggestedAdjustment;
          return { ...p };
        }
        return p;
      });
    });
  }, [setFinalRankings]);

  const clearAllSuggestions = useCallback(() => {
    console.log(`🔧 [MILESTONE_CLEAR_DEBUG] Clearing all suggestions`);
    setFinalRankings(prev => {
      return prev.map(p => {
        delete p.suggestedAdjustment;
        return { ...p };
      });
    });
  }, [setFinalRankings]);

  const freezePokemonForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    console.log(`🔧 [MILESTONE_FREEZE_DEBUG] Freezing Pokemon ${pokemonId} for tier ${tier}`);
  }, []);

  const isPokemonFrozenForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    return false;
  }, []);

  return {
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    handleSaveRankings,
    handleContinueBattles,
    resetMilestoneInProgress,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    freezePokemonForTier,
    isPokemonFrozenForTier
  };
};
