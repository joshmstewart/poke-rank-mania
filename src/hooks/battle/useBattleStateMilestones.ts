import { useCallback } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useTypeExtraction } from "./useTypeExtraction";

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
  const { getAllRatings, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const { extractPokemonTypes } = useTypeExtraction();

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

  // ENHANCED: Generate rankings from centralized TrueSkill store (unified with Manual Mode)
  const generateRankings = useCallback(() => {
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] ===== UNIFIED RANKING GENERATION START =====`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Using centralized TrueSkill store for consistency with Manual Mode`);
    
    // Get all Pokemon with TrueSkill ratings from the centralized store
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] ❌ No Pokemon with TrueSkill ratings found`);
      setFinalRankings([]);
      return;
    }

    // Create ranked Pokemon using centralized TrueSkill ratings
    const rankedPokemon: RankedPokemon[] = ratedPokemonIds
      .map(pokemonId => {
        const completePokemon = pokemonLookupMap.get(pokemonId);
        if (!completePokemon) {
          console.warn(`[RANKING_GENERATION_UNIFIED] Pokemon ID ${pokemonId} not found in lookup map`);
          return null;
        }

        // Get TrueSkill rating from centralized store
        const trueskillRating = getRating(pokemonId);
        const trueskillData = allRatings[pokemonId];
        
        console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] ${completePokemon.name}: μ=${trueskillRating.mu.toFixed(2)}, σ=${trueskillRating.sigma.toFixed(2)}, battles=${trueskillData.battleCount}`);

        // Calculate conservative score (mu - sigma) - Changed from 3 * sigma to 1 * sigma
        const conservativeEstimate = trueskillRating.mu - trueskillRating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (trueskillRating.sigma / 8.33))));

        // Extract types using helper function
        const { type1, type2 } = extractPokemonTypes(completePokemon);

        // Calculate battle statistics from battle history
        let wins = 0;
        let losses = 0;
        let totalBattles = 0;

        battleHistory.forEach(battleRecord => {
          const { battle, selected } = battleRecord;
          const pokemonInBattle = battle.find(p => p.id === pokemonId);
          if (pokemonInBattle) {
            totalBattles++;
            if (selected.includes(pokemonId)) {
              wins++;
            } else {
              losses++;
            }
          }
        });

        // Use TrueSkill battle count if no battle history available
        if (totalBattles === 0) {
          totalBattles = trueskillData.battleCount || 0;
        }

        const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

        const rankedPokemon: RankedPokemon = {
          ...completePokemon,
          types: completePokemon.types || [],
          type1,
          type2,
          score: conservativeEstimate,
          count: totalBattles,
          confidence: normalizedConfidence,
          wins,
          losses,
          winRate,
          rating: trueskillRating // Include the TrueSkill rating
        };

        console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Created ranking for ${completePokemon.name}: score=${conservativeEstimate.toFixed(2)}, confidence=${normalizedConfidence.toFixed(1)}%`);

        return rankedPokemon;
      })
      .filter(Boolean) as RankedPokemon[];

    // Sort by conservative score (highest first) - same as Manual Mode
    rankedPokemon.sort((a, b) => b.score - a.score);

    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Generated ${rankedPokemon.length} unified rankings`);
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Top 5 Pokemon:`, rankedPokemon.slice(0, 5).map(p => `${p.name} (score: ${p.score.toFixed(1)})`));
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Setting final rankings...`);
    setFinalRankings(rankedPokemon);
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] Setting ranking generated flag...`);
    setRankingGenerated(true);
    
    console.log(`🚨🚨🚨 [RANKING_GENERATION_UNIFIED] ===== UNIFIED RANKING GENERATION COMPLETE =====`);
  }, [battleHistory, getAllRatings, getRating, pokemonLookupMap, extractPokemonTypes, setFinalRankings, setRankingGenerated]);

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
