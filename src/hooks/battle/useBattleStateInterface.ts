
import { useMemo } from "react";
import { BattleType } from "./types";

export const useBattleStateInterface = (
  stateManagerData: any,
  providersData: any,
  actionsData: any,
  isAnyProcessing: boolean,
  enhancedStartNewBattle: (battleType: BattleType) => any
) => {
  return useMemo(() => ({
    currentBattle: stateManagerData.currentBattle,
    battleResults: stateManagerData.battleResults,
    battlesCompleted: stateManagerData.battlesCompleted,
    showingMilestone: providersData.showingMilestone,
    setShowingMilestone: providersData.setShowingMilestone,
    selectedGeneration: stateManagerData.selectedGeneration,
    setSelectedGeneration: stateManagerData.setSelectedGeneration,
    completionPercentage: providersData.completionPercentage,
    rankingGenerated: providersData.rankingGenerated,
    selectedPokemon: stateManagerData.selectedPokemon,
    battleType: stateManagerData.battleType,
    setBattleType: stateManagerData.setBattleType,
    finalRankings: providersData.finalRankings,
    confidenceScores: providersData.confidenceScores,
    battleHistory: stateManagerData.battleHistory,
    activeTier: stateManagerData.activeTier,
    setActiveTier: stateManagerData.setActiveTier,
    isBattleTransitioning: stateManagerData.isTransitioning,
    isAnyProcessing,
    handlePokemonSelect: (id: number) => {
      actionsData.handlePokemonSelect(id);
    },
    handleTripletSelectionComplete: () => {
      if (stateManagerData.battleType === "triplets") {
        actionsData.processBattleResult(stateManagerData.selectedPokemon, stateManagerData.currentBattle, stateManagerData.battleType, stateManagerData.selectedGeneration);
      }
    },
    handleSelection: (id: number) => {
      actionsData.handlePokemonSelect(id);
    },
    goBack: actionsData.goBack,
    isProcessingResult: actionsData.isProcessingResult,
    startNewBattle: enhancedStartNewBattle,
    milestones: providersData.milestones,
    resetMilestones: providersData.resetMilestones,
    calculateCompletionPercentage: providersData.calculateCompletionPercentage,
    getSnapshotForMilestone: providersData.getSnapshotForMilestone,
    generateRankings: providersData.generateRankings,
    handleSaveRankings: providersData.handleSaveRankings,
    freezePokemonForTier: providersData.freezePokemonForTier,
    isPokemonFrozenForTier: providersData.isPokemonFrozenForTier,
    suggestRanking: providersData.suggestRanking,
    removeSuggestion: providersData.removeSuggestion,
    clearAllSuggestions: providersData.clearAllSuggestions,
    handleContinueBattles: actionsData.handleContinueBattles,
    resetMilestoneInProgress: actionsData.resetMilestoneInProgress,
    performFullBattleReset: actionsData.performFullBattleReset
  }), [
    stateManagerData,
    providersData,
    actionsData,
    isAnyProcessing,
    enhancedStartNewBattle
  ]);
};
