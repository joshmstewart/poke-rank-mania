
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateHandlers } from "./useBattleStateHandlers";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateMilestones } from "./useBattleStateMilestones";
import { useBattleStateProcessing } from "./useBattleStateProcessing";
import { useBattleStateData } from "./useBattleStateData";
import { useBattleStateMilestoneEvents } from "./useBattleStateMilestoneEvents";
import { useBattleStateLogging } from "./useBattleStateLogging";
import { useBattleStateCoordination } from "./useBattleStateCoordination";
import { useBattleStateEventHandlers } from "./useBattleStateEventHandlers";
import { useBattleStateProcessors } from "./useBattleStateProcessors";

export const useBattleStateCoreRefactored = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] ===== useBattleStateCoreRefactored called =====`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] Input params:`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] - allPokemon.length: ${allPokemon.length}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] - initialBattleType: ${initialBattleType}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] - initialSelectedGeneration: ${initialSelectedGeneration}`);
  
  // Use the state data management hook
  const stateData = useBattleStateData(initialBattleType, initialSelectedGeneration);
  
  // Use coordination hook for battle management
  const coordination = useBattleStateCoordination(
    allPokemon,
    initialBattleType,
    initialSelectedGeneration,
    stateData.finalRankings
  );
  
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] All state hooks initialized`);
  
  // Use logging hook
  useBattleStateLogging({
    battlesCompleted: stateData.battlesCompleted,
    milestones: stateData.milestones,
    showingMilestone: stateData.showingMilestone,
    rankingGenerated: stateData.rankingGenerated,
    finalRankings: stateData.finalRankings,
    battleHistory: stateData.battleHistory
  });

  const refinementQueue = useSharedRefinementQueue();

  // Use milestone events hook
  const milestoneEvents = useBattleStateMilestoneEvents({
    battlesCompleted: stateData.battlesCompleted,
    milestones: stateData.milestones,
    battleHistory: stateData.battleHistory,
    finalRankings: stateData.finalRankings,
    milestoneInProgress: stateData.milestoneInProgress,
    showingMilestone: stateData.showingMilestone,
    rankingGenerated: stateData.rankingGenerated,
    setMilestoneInProgress: stateData.setMilestoneInProgress,
    setShowingMilestone: stateData.setShowingMilestone,
    setRankingGenerated: stateData.setRankingGenerated,
    setSelectedPokemon: stateData.setSelectedPokemon,
    setBattleHistory: stateData.setBattleHistory,
    setBattlesCompleted: stateData.setBattlesCompleted,
    setBattleResults: stateData.setBattleResults
  });

  // Use processors hook
  const processors = useBattleStateProcessors(
    stateData,
    milestoneEvents,
    () => {} // Will be set later
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] About to call milestoneHandlers...`);

  // Initialize milestone handlers
  const milestoneHandlers = useBattleStateMilestones(
    stateData.finalRankings,
    stateData.battleHistory,
    stateData.battlesCompleted,
    stateData.completionPercentage,
    stateData.setShowingMilestone,
    stateData.setMilestoneInProgress,
    stateData.setRankingGenerated,
    processors.setFinalRankingsWithLogging,
    () => {} // Will be set later
  );

  // Use event handlers hook - CRITICAL FIX: pass startNewBattleAsync instead of startNewBattle
  const eventHandlers = useBattleStateEventHandlers(
    allPokemon,
    stateData,
    coordination.startNewBattleAsync,
    milestoneHandlers,
    processors.setFinalRankingsWithLogging
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] milestoneHandlers created, about to call handlers...`);

  // Create handlers with proper generateRankings - CRITICAL FIX: use synchronous startNewBattle
  const handlers = useBattleStateHandlers(
    allPokemon,
    stateData.currentBattle,
    stateData.selectedPokemon,
    stateData.battleType,
    stateData.selectedGeneration,
    stateData.battlesCompleted,
    stateData.milestones,
    stateData.finalRankings,
    stateData.frozenPokemon,
    stateData.battleHistory,
    coordination.startNewBattle, // synchronous version
    coordination.getCurrentRankings,
    refinementQueue,
    stateData.setBattleHistory,
    stateData.setBattlesCompleted,
    stateData.setBattleResults,
    stateData.setSelectedPokemon,
    stateData.setCurrentBattle,
    stateData.setMilestoneInProgress,
    stateData.setShowingMilestone,
    stateData.setRankingGenerated,
    stateData.setIsBattleTransitioning,
    stateData.setIsAnyProcessing,
    processors.processBattleResultWithRefinement,
    processors.clearAllSuggestions,
    refinementQueue.clearRefinementQueue,
    milestoneHandlers.generateRankings
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] handlers created, about to call processingHandlers...`);

  const processingHandlers = useBattleStateProcessing(
    stateData.selectedPokemon,
    stateData.currentBattle,
    stateData.battleType,
    stateData.selectedGeneration,
    stateData.isAnyProcessing,
    stateData.isProcessingResult,
    processors.processBattleResultWithRefinement,
    stateData.setIsBattleTransitioning,
    stateData.setIsAnyProcessing,
    eventHandlers.startNewBattleWrapper
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] processingHandlers created, about to call effects...`);

  // Initialize effects - CRITICAL FIX: use synchronous startNewBattle
  const { processingRef } = useBattleStateEffects(
    allPokemon,
    stateData.battleType,
    stateData.selectedGeneration,
    stateData.frozenPokemon,
    stateData.currentBattle,
    stateData.selectedPokemon,
    stateData.isAnyProcessing,
    stateData.isProcessingResult,
    coordination.startNewBattle, // synchronous version
    coordination.getCurrentRankings,
    stateData.setCurrentBattle,
    stateData.setSelectedPokemon,
    processingHandlers.handleTripletSelectionComplete,
    processors.setFinalRankingsWithLogging
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] All hooks completed, preparing return object...`);

  return {
    currentBattle: stateData.currentBattle,
    battleResults: stateData.battleResults,
    battlesCompleted: stateData.battlesCompleted,
    showingMilestone: stateData.showingMilestone,
    setShowingMilestone: stateData.setShowingMilestone,
    selectedGeneration: stateData.selectedGeneration,
    setSelectedGeneration: stateData.setSelectedGeneration,
    completionPercentage: stateData.completionPercentage,
    rankingGenerated: stateData.rankingGenerated,
    selectedPokemon: stateData.selectedPokemon,
    battleType: stateData.battleType,
    setBattleType: stateData.setBattleType,
    finalRankings: stateData.finalRankings,
    confidenceScores: stateData.confidenceScores,
    battleHistory: stateData.battleHistory,
    activeTier: stateData.activeTier,
    setActiveTier: stateData.setActiveTier,
    isBattleTransitioning: stateData.isBattleTransitioning,
    isAnyProcessing: stateData.isAnyProcessing,
    isProcessingResult: stateData.isProcessingResult,
    milestones: stateData.milestones,
    resetMilestones: stateData.resetMilestones,
    calculateCompletionPercentage: milestoneHandlers.calculateCompletionPercentage,
    getSnapshotForMilestone: milestoneHandlers.getSnapshotForMilestone,
    handlePokemonSelect: handlers.handlePokemonSelect,
    handleTripletSelectionComplete: processingHandlers.handleTripletSelectionComplete,
    goBack: handlers.goBack,
    generateRankings: milestoneHandlers.generateRankings,
    handleSaveRankings: milestoneHandlers.handleSaveRankings,
    freezePokemonForTier: milestoneHandlers.freezePokemonForTier,
    isPokemonFrozenForTier: milestoneHandlers.isPokemonFrozenForTier,
    suggestRanking: milestoneHandlers.suggestRanking,
    removeSuggestion: milestoneHandlers.removeSuggestion,
    clearAllSuggestions: milestoneHandlers.clearAllSuggestions,
    handleContinueBattles: milestoneHandlers.handleContinueBattles,
    resetMilestoneInProgress: milestoneHandlers.resetMilestoneInProgress,
    performFullBattleReset: handlers.performFullBattleReset,
    handleManualReorder: handlers.handleManualReorder,
    pendingRefinements: handlers.pendingRefinements,
    refinementBattleCount: handlers.refinementBattleCount,
    clearRefinementQueue: handlers.clearRefinementQueue,
    startNewBattle: handlers.startNewBattleWrapper
  };
};
