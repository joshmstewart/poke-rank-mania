
import { useCallback } from "react";
import { useMilestoneCalculations } from "./useMilestoneCalculations";
import { useRankingGeneration } from "./useRankingGeneration";
import { useMilestoneHandlers } from "./useMilestoneHandlers";

export const useBattleStateMilestones = (
  finalRankings: any[],
  battleHistory: { battle: any[], selected: number[] }[],
  battlesCompleted: number,
  completionPercentage: number,
  setShowingMilestone: (showing: boolean) => void,
  setMilestoneInProgress: (inProgress: boolean) => void,
  setRankingGenerated: (generated: boolean) => void,
  setFinalRankings: (rankings: any) => void,
  startNewBattleWrapper: () => void
) => {
  // Use milestone calculations
  const { calculateCompletionPercentage, getSnapshotForMilestone } = useMilestoneCalculations(
    battlesCompleted,
    completionPercentage,
    finalRankings,
    battleHistory
  );

  // Use ranking generation
  const { generateRankings } = useRankingGeneration(
    battleHistory,
    setFinalRankings,
    setRankingGenerated
  );

  // Use milestone handlers
  const {
    handleSaveRankings,
    handleContinueBattles,
    resetMilestoneInProgress,
    triggerMilestoneView,
    forceTriggerMilestone,
    triggerMilestone25
  } = useMilestoneHandlers(
    battlesCompleted,
    generateRankings,
    setShowingMilestone,
    setMilestoneInProgress,
    setRankingGenerated,
    startNewBattleWrapper
  );

  // Placeholder functions for suggestions and freezing (not implemented in original)
  const suggestRanking = useCallback(() => {}, []);
  const removeSuggestion = useCallback(() => {}, []);
  const clearAllSuggestions = useCallback(() => {}, []);
  const freezePokemonForTier = useCallback(() => {}, []);
  const isPokemonFrozenForTier = useCallback(() => false, []);

  return {
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    handleSaveRankings,
    handleContinueBattles,
    resetMilestoneInProgress,
    triggerMilestoneView,
    forceTriggerMilestone,
    triggerMilestone25,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    freezePokemonForTier,
    isPokemonFrozenForTier
  };
};
