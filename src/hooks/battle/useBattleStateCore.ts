
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useGenerationState } from "./useGenerationState";
import { useBattleTypeState } from "./useBattleTypeState";
import { useProgressState } from "./useProgressState";
import { useBattleSelectionState } from "./useBattleSelectionState";
import { useBattleStateIO } from "./useBattleStateIO";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateCoordinator } from "./useBattleStateCoordinator";
import { useBattleManager } from "./useBattleManager";

/**
 * Core hook that composes all battle state functionality
 */
export const useBattleStateCore = () => {
  // Use smaller focused hooks for specific functionality
  const generationState = useGenerationState();
  const battleTypeState = useBattleTypeState();
  const progressState = useProgressState();
  const selectionState = useBattleSelectionState();
  
  // Initialize all variables before using them in other hooks
  const allPokemonSafe = Array.isArray(selectionState.allPokemon) && selectionState.allPokemon.length > 0 ? 
    selectionState.allPokemon : [];
  
  // Create an adapter function to match the expected signatures
  // This is the key fix - we're creating an adapter that takes only battleType
  const startNewBattleAdapter = (battleType: BattleType) => {
    selectionState.startNewBattle(battleType);
  };
  
  // IO related functionality (loading Pokemon, storage, etc)
  const { 
    isLoading, 
    loadPokemon,
    saveBattleState,
    loadBattleState,
    finalRankings,
    generateRankings,
    handleSaveRankings,
    getBattlesRemaining,
    calculateCompletionPercentage
  } = useBattleStateIO({
    setAllPokemon: selectionState.setAllPokemon,
    setRankingGenerated: progressState.setRankingGenerated,
    setBattleResults: selectionState.setBattleResults,
    setBattlesCompleted: selectionState.setBattlesCompleted,
    setBattleHistory: selectionState.setBattleHistory,
    setShowingMilestone: progressState.setShowingMilestone,
    setCompletionPercentage: progressState.setCompletionPercentage,
    setSelectedPokemon: selectionState.setSelectedPokemon,
    startNewBattle: startNewBattle,

    battleType: battleTypeState.battleType,
    allPokemon: allPokemonSafe,
    battleResults: selectionState.battleResults
  });
  
  // Actions related to battle state
  const { 
    handleGenerationChange,
    handleBattleTypeChange,
    handleContinueBattles,
    handleNewBattleSet 
  } = useBattleStateActions({
    setRankingGenerated: progressState.setRankingGenerated,
    setBattleResults: selectionState.setBattleResults,
    setBattlesCompleted: selectionState.setBattlesCompleted,
    setBattleHistory: selectionState.setBattleHistory,
    setShowingMilestone: progressState.setShowingMilestone,
    setCompletionPercentage: progressState.setCompletionPercentage,
   startNewBattle: startNewBattle,

    allPokemon: allPokemonSafe,
    generateRankings,
    battleType: battleTypeState.battleType
  });
  
  // Synchronize settings state
  if (handleGenerationChange.generationSetting !== generationState.selectedGeneration) {
    generationState.setSelectedGeneration(handleGenerationChange.generationSetting);
  }
  
  // Coordinator for state initialization and persistence
  useBattleStateCoordinator({
    isLoading,
    allPokemon: allPokemonSafe,
    selectedGeneration: generationState.selectedGeneration,
    battleType: battleTypeState.battleType,
    battleResults: selectionState.battleResults,
    battlesCompleted: selectionState.battlesCompleted, 
    battleHistory: selectionState.battleHistory,
    completionPercentage: progressState.completionPercentage,
    fullRankingMode: progressState.fullRankingMode,
    saveBattleState,
    loadBattleState,
    loadPokemon,
    calculateCompletionPercentage
  });
  
  // Add battle manager for selection and interaction handling
  const {
    selectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    isProcessingResult: isProcessing
  } = useBattleManager(
    selectionState.battleResults,
    selectionState.setBattleResults,
    selectionState.battlesCompleted,
    selectionState.setBattlesCompleted,
    allPokemonSafe,
    startNewBattleAdapter, // Use our adapter here too
    progressState.setShowingMilestone,
    progressState.milestones,
    generateRankings,
    selectionState.battleHistory,
    selectionState.setBattleHistory,
    selectionState.setSelectedPokemon
  );
  
  // Return all necessary state and functions for components
  return {
    // State
    isLoading,
    selectedGeneration: generationState.selectedGeneration,
    allPokemon: selectionState.allPokemon,
    battleType: battleTypeState.battleType,
    currentBattle: selectionState.currentBattle,
    battleResults: selectionState.battleResults,
    selectedPokemon: selectedPokemon || selectionState.selectedPokemon,
    battlesCompleted: selectionState.battlesCompleted,
    rankingGenerated: progressState.rankingGenerated,
    finalRankings,
    battleHistory: selectionState.battleHistory,
    showingMilestone: progressState.showingMilestone,
    completionPercentage: progressState.completionPercentage,
    fullRankingMode: progressState.fullRankingMode,
    milestones: progressState.milestones,
    isProcessing,
    
    // Actions
    handleGenerationChange,
    handleBattleTypeChange,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSaveRankings,
    handleContinueBattles,
    handleNewBattleSet,
    goBack,
    getBattlesRemaining,
    loadPokemon,
  startNewBattle: startNewBattle,

  };
};
