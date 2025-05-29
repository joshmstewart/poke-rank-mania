
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

  // ENHANCED: Detailed logging for ranking generation
  const generateRankings = useCallback(() => {
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] ===== GENERATING RANKINGS =====`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Current finalRankings length: ${finalRankings.length}`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] battleHistory length: ${battleHistory.length}`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] battlesCompleted: ${battlesCompleted}`);
    
    if (finalRankings.length > 0) {
      console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Sample existing rankings:`, finalRankings.slice(0, 5).map(p => `${p.name} (${p.id}) - score: ${p.score}`));
    } else {
      console.log(`🚨 [MILESTONE_RANKINGS_ULTRA_DEBUG] WARNING: finalRankings is EMPTY - this may be why Pokemon aren't showing!`);
      console.log(`🚨 [MILESTONE_RANKINGS_ULTRA_DEBUG] This suggests the TrueSkill ranking system hasn't populated finalRankings yet`);
    }
    
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Setting ranking generated flag - external TrueSkill system should handle ranking generation`);
    setRankingGenerated(true);
    
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] ===== END RANKING GENERATION =====`);
  }, [finalRankings, battleHistory, battlesCompleted, setRankingGenerated]);

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
