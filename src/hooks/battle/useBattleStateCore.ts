
import { useCallback, useMemo, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useBattleStateHandlers } from "./useBattleStateHandlers";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateMilestones } from "./useBattleStateMilestones";
import { useBattleStateProcessing } from "./useBattleStateProcessing";
import { useBattleStateData } from "./useBattleStateData";
import { useBattleStateMilestoneEvents } from "./useBattleStateMilestoneEvents";
import { useBattleStateLogging } from "./useBattleStateLogging";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] ===== useBattleStateCore called =====`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] Input params:`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - allPokemon.length: ${allPokemon.length}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - initialBattleType: ${initialBattleType}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - initialSelectedGeneration: ${initialSelectedGeneration}`);
  
  // Use the state data management hook
  const stateData = useBattleStateData(initialBattleType, initialSelectedGeneration);
  
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] All state hooks initialized`);
  
  // Use logging hook
  useBattleStateLogging({
    battlesCompleted: stateData.battlesCompleted,
    milestones: stateData.milestones,
    showingMilestone: stateData.showingMilestone,
    rankingGenerated: stateData.rankingGenerated,
    finalRankings: stateData.finalRankings,
    battleHistory: stateData.battleHistory
  });

  // getCurrentRankings must be defined before other hooks that use it
  const getCurrentRankings = useCallback(() => {
    console.log(`🔧 [RANKINGS_DEBUG] getCurrentRankings called - finalRankings length: ${stateData.finalRankings.length}`);
    console.log(`🔧 [RANKINGS_DEBUG] Sample rankings:`, stateData.finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
    return stateData.finalRankings;
  }, [stateData.finalRankings]);
  
  // Initialize other hooks
  const { startNewBattle: startNewBattleCore } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // Create a simple wrapper for startNewBattle that matches the expected signature
  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log(`🚀 [START_NEW_BATTLE_FIX] Creating new battle for type: ${battleType}`);
    return startNewBattleCore(battleType);
  }, [startNewBattleCore]);

  // Enhanced setFinalRankings wrapper with detailed logging
  const setFinalRankingsWithLogging = useCallback((rankings: any) => {
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ===== setFinalRankings called =====`);
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] Input type: ${typeof rankings}`);
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] Input is array: ${Array.isArray(rankings)}`);
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] Input length: ${rankings?.length || 'no length property'}`);
    
    if (Array.isArray(rankings) && rankings.length > 0) {
      console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] First 3 Pokemon being set:`, rankings.slice(0, 3).map(p => `${p.name} (${p.id}) - score: ${p.score?.toFixed(1) || 'no score'}`));
    }
    
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] About to call actual setFinalRankings...`);
    
    try {
      stateData.setFinalRankings(rankings);
      console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ✅ setFinalRankings call completed successfully`);
    } catch (error) {
      console.error(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ❌ Error in setFinalRankings:`, error);
    }
    
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ===== setFinalRankings call end =====`);
  }, [stateData.setFinalRankings]);

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

  // Add processBattleResultWithRefinement function
  const processBattleResultWithRefinement = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [REFINEMENT_PROCESSING_DEBUG] Processing battle with refinement support`);
    return milestoneEvents.originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [milestoneEvents.originalProcessBattleResult]);

  // Add clearAllSuggestions placeholder
  const clearAllSuggestions = useCallback(() => {
    console.log('🔄 [SUGGESTIONS_DEBUG] Clearing all suggestions');
  }, []);

  // Create a temporary startNewBattleWrapper for milestoneHandlers
  const tempStartNewBattleWrapper = useCallback(() => {
    console.log(`🚀 [TEMP_START_NEW_BATTLE] Temporary wrapper called - this should be replaced`);
  }, []);

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] About to call milestoneHandlers...`);

  // Initialize milestone handlers
  const milestoneHandlers = useBattleStateMilestones(
    stateData.finalRankings,
    stateData.battleHistory,
    stateData.battlesCompleted,
    stateData.completionPercentage,
    stateData.setShowingMilestone,
    stateData.setMilestoneInProgress,
    stateData.setRankingGenerated,
    setFinalRankingsWithLogging,
    tempStartNewBattleWrapper
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] milestoneHandlers created, about to call handlers...`);

  // Create handlers with proper generateRankings
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
    startNewBattle,
    getCurrentRankings,
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
    processBattleResultWithRefinement,
    clearAllSuggestions,
    refinementQueue.clearRefinementQueue,
    milestoneHandlers.generateRankings
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] handlers created, about to call processingHandlers...`);

  const processingHandlers = useBattleStateProcessing(
    stateData.selectedPokemon,
    stateData.currentBattle,
    stateData.battleType,
    stateData.selectedGeneration,
    stateData.isAnyProcessing,
    stateData.isProcessingResult,
    processBattleResultWithRefinement,
    stateData.setIsBattleTransitioning,
    stateData.setIsAnyProcessing,
    handlers.startNewBattleWrapper
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] processingHandlers created, about to call effects...`);

  // Initialize effects
  const { processingRef } = useBattleStateEffects(
    allPokemon,
    stateData.battleType,
    stateData.selectedGeneration,
    stateData.frozenPokemon,
    stateData.currentBattle,
    stateData.selectedPokemon,
    stateData.isAnyProcessing,
    stateData.isProcessingResult,
    startNewBattle,
    getCurrentRankings,
    stateData.setCurrentBattle,
    stateData.setSelectedPokemon,
    processingHandlers.handleTripletSelectionComplete,
    setFinalRankingsWithLogging
  );

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] effects created, setting up final useEffects...`);

  // Completion percentage calculation
  useEffect(() => {
    const percentage = milestoneHandlers.calculateCompletionPercentage();
    console.log(`🔧 [COMPLETION_DEBUG] Calculated completion percentage: ${percentage}% for ${stateData.battlesCompleted} battles`);
    stateData.setCompletionPercentage(percentage);
  }, [stateData.battlesCompleted, milestoneHandlers, stateData.setCompletionPercentage]);

  // Event listener for milestone ranking generation
  useEffect(() => {
    const handleGenerateMilestoneRankings = (event: CustomEvent) => {
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Received generate-milestone-rankings event:`, event.detail);
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Current battle history length: ${stateData.battleHistory.length}`);
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Calling milestoneHandlers.generateRankings...`);
      
      try {
        milestoneHandlers.generateRankings();
        console.log(`🔥 [MILESTONE_RANKING_EVENT] ✅ generateRankings called successfully`);
      } catch (error) {
        console.error(`🔥 [MILESTONE_RANKING_EVENT] ❌ Error calling generateRankings:`, error);
      }
    };

    document.addEventListener('generate-milestone-rankings', handleGenerateMilestoneRankings as EventListener);
    
    return () => {
      document.removeEventListener('generate-milestone-rankings', handleGenerateMilestoneRankings as EventListener);
    };
  }, [milestoneHandlers, stateData.battleHistory]);

  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] All hooks completed, preparing return object...`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] Final state summary:`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - currentBattle length: ${stateData.currentBattle.length}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - battlesCompleted: ${stateData.battlesCompleted}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - showingMilestone: ${stateData.showingMilestone}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - finalRankings length: ${stateData.finalRankings.length}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_MEGA_DEBUG] - battleHistory length: ${stateData.battleHistory.length}`);

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
