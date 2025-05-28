
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
    return percentage;
  }, [battlesCompleted]);

  const getSnapshotForMilestone = useCallback(() => {
    const snapshot = {
      rankings: [...finalRankings],
      battleHistory: [...battleHistory],
      battlesCompleted,
      completionPercentage
    };
    return JSON.stringify(snapshot);
  }, [finalRankings, battleHistory, battlesCompleted, completionPercentage]);

  // UPDATED: Remove the basic ranking generation - let the external TrueSkill system handle all rankings
  const generateRankings = useCallback(() => {
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Setting ranking generated flag - external TrueSkill system will handle ranking generation`);
    setRankingGenerated(true);
  }, [setRankingGenerated]);

  const handleSaveRankings = useCallback(() => {
    setShowingMilestone(false);
  }, [setShowingMilestone]);

  const handleContinueBattles = useCallback(() => {
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    startNewBattleWrapper();
  }, [startNewBattleWrapper, setShowingMilestone, setMilestoneInProgress]);

  const resetMilestoneInProgress = useCallback(() => {
    setMilestoneInProgress(false);
  }, [setMilestoneInProgress]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
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
    setFinalRankings(prev => {
      return prev.map(p => {
        delete p.suggestedAdjustment;
        return { ...p };
      });
    });
  }, [setFinalRankings]);

  const freezePokemonForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    // Implementation would go here - this was in the original file
    console.log(`Freezing Pokemon ${pokemonId} for tier ${tier}`);
  }, []);

  const isPokemonFrozenForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    // Implementation would go here - this was in the original file
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
