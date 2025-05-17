
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useGenerationState } from "./useGenerationState";
import { useBattleTypeState } from "./useBattleTypeState";
import { useProgressState } from "./useProgressState";
import { useBattleSelectionState } from "./useBattleSelectionState";
import { useBattleStateIO } from "./useBattleStateIO";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateCoordinator } from "./useBattleStateCoordinator";

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
    startNewBattle: selectionState.startNewBattle,
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
    startNewBattle: selectionState.startNewBattle,
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
  
  // Return all necessary state and functions for components
  return {
    // State
    isLoading,
    selectedGeneration: generationState.selectedGeneration,
    allPokemon: selectionState.allPokemon,
    battleType: battleTypeState.battleType,
    currentBattle: selectionState.currentBattle,
    battleResults: selectionState.battleResults,
    selectedPokemon: selectionState.selectedPokemon,
    battlesCompleted: selectionState.battlesCompleted,
    rankingGenerated: progressState.rankingGenerated,
    finalRankings,
    battleHistory: selectionState.battleHistory,
    showingMilestone: progressState.showingMilestone,
    completionPercentage: progressState.completionPercentage,
    fullRankingMode: progressState.fullRankingMode,
    milestones: progressState.milestones,
    isProcessing: selectionState.isProcessing,
    
    // Actions
    setSelectedGeneration: handleGenerationChange,
    handleGenerationChange,
    handleBattleTypeChange,
    setBattleType: handleBattleTypeChange,
    handlePokemonSelect: selectionState.handlePokemonSelect,
    handleTripletSelectionComplete: selectionState.handleTripletSelectionComplete,
    handleSaveRankings,
    handleContinueBattles,
    handleNewBattleSet,
    goBack: selectionState.goBack,
    getBattlesRemaining,
    loadPokemon,
    startNewBattle: selectionState.startNewBattle
  };
};
