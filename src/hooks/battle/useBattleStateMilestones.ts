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

  // ENHANCED: Generate rankings with ULTRA detailed logging
  const generateRankings = useCallback(() => {
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] ===== STARTING RANKING GENERATION =====`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Function called with:`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] - battleHistory.length: ${battleHistory.length}`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] - battlesCompleted: ${battlesCompleted}`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] - current finalRankings.length: ${finalRankings.length}`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] - setFinalRankings function type: ${typeof setFinalRankings}`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] - setFinalRankings function exists: ${!!setFinalRankings}`);
    
    if (battleHistory.length === 0) {
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] ❌ CRITICAL ERROR: No battle history available!`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] This is why rankings can't be generated`);
      return;
    }

    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Processing ${battleHistory.length} battles...`);
    
    // Log each battle in history with extreme detail
    battleHistory.forEach((battleRecord, index) => {
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Battle #${index + 1}:`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Pokemon: ${battleRecord.battle.map(p => `${p.name} (${p.id})`).join(' vs ')}`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Selected IDs: [${battleRecord.selected.join(', ')}]`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Battle object type: ${typeof battleRecord.battle}`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Battle is array: ${Array.isArray(battleRecord.battle)}`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Selected object type: ${typeof battleRecord.selected}`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Selected is array: ${Array.isArray(battleRecord.selected)}`);
    });

    // Create Pokemon stats map with detailed logging
    const pokemonStats = new Map<number, { pokemon: any, wins: number, losses: number, battles: number }>();
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Starting battle processing...`);
    
    battleHistory.forEach((battleRecord, battleIndex) => {
      const { battle, selected } = battleRecord;
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Processing battle #${battleIndex + 1}: ${battle.map(p => p.name).join(' vs ')}`);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Selected in this battle: [${selected.join(', ')}]`);
      
      battle.forEach((pokemon, pokemonIndex) => {
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Processing Pokemon #${pokemonIndex + 1}: ${pokemon.name} (ID: ${pokemon.id})`);
        
        if (!pokemonStats.has(pokemon.id)) {
          console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]     First time seeing ${pokemon.name} - initializing stats`);
          pokemonStats.set(pokemon.id, {
            pokemon,
            wins: 0,
            losses: 0,
            battles: 0
          });
        }
        
        const stats = pokemonStats.get(pokemon.id)!;
        stats.battles++;
        
        const wasSelected = selected.includes(pokemon.id);
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]     Was ${pokemon.name} selected? ${wasSelected}`);
        
        if (wasSelected) {
          stats.wins++;
          console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]     ✅ ${pokemon.name} WON this battle (wins: ${stats.wins})`);
        } else {
          stats.losses++;
          console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]     ❌ ${pokemon.name} LOST this battle (losses: ${stats.losses})`);
        }
        
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]     ${pokemon.name} total stats: ${stats.wins}W/${stats.losses}L (${stats.battles} battles)`);
      });
    });

    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Stats collection complete. Pokemon in stats map: ${pokemonStats.size}`);
    
    if (pokemonStats.size === 0) {
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] ❌ CRITICAL ERROR: No Pokemon stats generated!`);
      return;
    }

    // Convert to ranked pokemon with extreme logging
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Converting stats to ranked Pokemon...`);
    const rankedPokemon: RankedPokemon[] = Array.from(pokemonStats.values())
      .map(({ pokemon, wins, losses, battles }, index) => {
        const winRate = battles > 0 ? wins / battles : 0;
        const score = winRate * 100 + (wins * 5); // Simple scoring system
        
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Ranking #${index + 1}: ${pokemon.name}`);
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Wins: ${wins}, Losses: ${losses}, Battles: ${battles}`);
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Win rate: ${(winRate * 100).toFixed(1)}%`);
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Calculated score: ${score.toFixed(1)}`);
        
        const rankedPokemon: RankedPokemon = {
          ...pokemon,
          score,
          count: battles,
          confidence: Math.min(battles * 10, 100), // Confidence increases with more battles
          wins,
          losses,
          winRate
        };
        
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG]   Final ranking object:`, {
          id: rankedPokemon.id,
          name: rankedPokemon.name,
          score: rankedPokemon.score,
          wins: rankedPokemon.wins,
          losses: rankedPokemon.losses
        });
        
        return rankedPokemon;
      })
      .sort((a, b) => {
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Sorting: ${a.name} (${a.score.toFixed(1)}) vs ${b.name} (${b.score.toFixed(1)})`);
        return b.score - a.score;
      }); // Sort by score descending

    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Ranking conversion complete!`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Generated ${rankedPokemon.length} ranked Pokemon`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Top 5 Pokemon:`, rankedPokemon.slice(0, 5).map(p => `${p.name} (score: ${p.score.toFixed(1)})`));
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] About to call setFinalRankings with ${rankedPokemon.length} Pokemon...`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] setFinalRankings function:`, setFinalRankings);
    
    // CRITICAL: Actually set the rankings with immediate verification
    try {
      setFinalRankings(rankedPokemon);
      console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] ✅ setFinalRankings called successfully`);
      
      // Verify the call worked with a timeout
      setTimeout(() => {
        console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Verification check - current finalRankings length should be ${rankedPokemon.length}`);
      }, 50);
      
    } catch (error) {
      console.error(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] ❌ ERROR calling setFinalRankings:`, error);
    }
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] Setting ranking generated flag...`);
    setRankingGenerated(true);
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_MEGA_DEBUG] ===== RANKING GENERATION COMPLETE =====`);
  }, [battleHistory, battlesCompleted, setFinalRankings, setRankingGenerated]);

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
