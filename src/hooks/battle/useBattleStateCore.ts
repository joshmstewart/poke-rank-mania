
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

  // Fix: Create a proper adapter function for the multiple-argument startNewBattle
  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType) => {
    console.log(`startNewBattle with ${pokemonList.length} Pokémon and type: ${battleType}`);
    
    if (!pokemonList || pokemonList.length < 2) {
      console.error("Invalid Pokemon list for battle:", pokemonList);
      return;
    }
    
    // Update allPokemon if it's not set yet
    if (allPokemonSafe.length === 0 && pokemonList.length > 0) {
      selectionState.setAllPokemon(pokemonList);
    }
    
    // Create a battle with the first few Pokemon
    const battleSize = battleType === "triplets" ? 3 : 2;
    if (pokemonList.length >= battleSize) {
      const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
      const battlePokemon = shuffled.slice(0, battleSize);
      console.log(`Setting up ${battleType} battle with:`, battlePokemon.map(p => p.name));
      selectionState.setCurrentBattle(battlePokemon);
    } else {
      console.error(`Not enough Pokémon for a ${battleType} battle. Need ${battleSize}, have ${pokemonList.length}`);
    }
  };

  // Define an adapter function for the single-argument version
  const startNewBattleAdapter = (battleType: BattleType) => {
    console.log("startNewBattleAdapter with type:", battleType);
    
    // If we have Pokemon, start a battle with them
    if (allPokemonSafe && allPokemonSafe.length >= 2) {
      startNewBattle(allPokemonSafe, battleType);
    } else {
      console.error("No Pokémon available for battle");
    }
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
    startNewBattle: startNewBattle, // Fixed signature
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
    startNewBattle: startNewBattleAdapter,
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
    startNewBattleAdapter,
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
    startNewBattle: startNewBattleAdapter, // Using the adapter here
  };
};
