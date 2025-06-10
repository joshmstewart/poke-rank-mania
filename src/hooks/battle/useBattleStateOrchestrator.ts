
import { useBattleStateMilestoneEvents } from "./useBattleStateMilestoneEvents";
import { useBattleStateProcessors } from "./useBattleStateProcessors";
import { useBattleStateMilestones } from "./useBattleStateMilestones";
import { useBattleStateEventHandlers } from "./useBattleStateEventHandlers";
import { useBattleStateHandlers } from "./useBattleStateHandlers";
import { useBattleStateProcessing } from "./useBattleStateProcessing";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { Pokemon } from "@/services/pokemon";

export const useBattleStateOrchestrator = (
  allPokemon: Pokemon[],
  stateData: any,
  coordination: any,
  refinementQueue: any
) => {
  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] Starting orchestration...`);

  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] About to call milestoneHandlers...`);

  // Initialize milestone handlers FIRST to get generateRankings function
  const milestoneHandlers = useBattleStateMilestones(
    stateData.finalRankings,
    stateData.battleHistory,
    stateData.battlesCompleted,
    stateData.completionPercentage,
    stateData.setShowingMilestone,
    stateData.setMilestoneInProgress,
    stateData.setRankingGenerated,
    stateData.setFinalRankings,
    coordination.startNewBattle
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] milestoneHandlers created with generateRankings function`);

  // MILESTONE INVESTIGATION: Log before passing to milestone events
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] About to pass milestones to useBattleStateMilestoneEvents:`, stateData.milestones);
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Passing generateRankings function:`, !!milestoneHandlers.generateRankings);
  
  // Use milestone events hook - CRITICAL FIX: Pass generateRankings function
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
    setBattleResults: stateData.setBattleResults,
    generateRankings: milestoneHandlers.generateRankings // CRITICAL FIX: Pass the function
  });

  // Use event handlers hook - CRITICAL FIX: pass startNewBattleAsync instead of startNewBattle
  const eventHandlers = useBattleStateEventHandlers(
    allPokemon,
    stateData,
    coordination.startNewBattleAsync
  );

  // Use processors hook
  const processors = useBattleStateProcessors(
    stateData,
    milestoneEvents,
    eventHandlers.startNewBattleWrapper
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] About to call handlers...`);

  // Create handlers with proper generateRankings - CRITICAL FIX: use synchronous startNewBattle and add setFinalRankings
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
    milestoneHandlers.generateRankings,
    stateData.setFinalRankings
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] handlers created, about to call processingHandlers...`);

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

  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] processingHandlers created, about to call effects...`);

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

  console.log(`🚨🚨🚨 [BATTLE_STATE_ORCHESTRATOR] All hooks completed, preparing return object...`);

  return {
    milestoneHandlers,
    handlers,
    processingHandlers,
    processingRef
  };
};
