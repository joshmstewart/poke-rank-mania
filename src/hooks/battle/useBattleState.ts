
import { useGenerationState } from "./useGenerationState";
import { useBattleTypeState } from "./useBattleTypeState";
import { useProgressState } from "./useProgressState";
import { useBattleSelectionState } from "./useBattleSelectionState";
import { usePokemonLoader } from "./usePokemonLoader";
import { useLocalStorage } from "./useLocalStorage";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";
import { useBattleManager } from "./useBattleManager";
import { useBattleCoordinatorState } from "./useBattleCoordinatorState";
import { useBattleInteractions } from "./useBattleInteractions";
import { Pokemon } from "@/services/pokemon";

import { BattleType } from "./types";

export * from "./types";

/**
 * Main hook for all battle state management
 */
export const useBattleState = () => {
  // Use smaller focused hooks for specific functionality
  const generationState = useGenerationState();
  const battleTypeState = useBattleTypeState();
  const progressState = useProgressState();
  const selectionState = useBattleSelectionState();
  
  // Pokemon loading logic
const {
  isLoading,
  loadPokemon
} = usePokemonLoader({
  setAllPokemon: selectionState.setAllPokemon,
  setRankingGenerated: progressState.setRankingGenerated,
  setBattleResults: selectionState.setBattleResults,
  setBattlesCompleted: selectionState.setBattlesCompleted,
  setBattleHistory: selectionState.setBattleHistory,
  setShowingMilestone: progressState.setShowingMilestone,
  setCompletionPercentage: progressState.setCompletionPercentage,
  setSelectedPokemon: selectionState.setSelectedPokemon,
  startNewBattle: selectionState.startNewBattle,
  battleType: battleTypeState.battleType
});

  
  // Local storage management
  const { saveBattleState, loadBattleState } = useLocalStorage();
  
  // Rankings generation and management
const allPokemonSafe: Pokemon[] = Array.isArray(selectionState.allPokemon) && typeof selectionState.allPokemon[0] === "object"
  ? selectionState.allPokemon
  : [];

const { finalRankings, generateRankings, handleSaveRankings: saveRankings } = useRankings(allPokemonSafe);




  
  // Generation settings management
const {
  selectedGeneration: generationSetting,
  handleGenerationChange,
  handleBattleTypeChange,
} = useGenerationSettings(
  (pokemonList: Pokemon[]) => {
    selectionState.startNewBattle(pokemonList, battleTypeState.battleType);
  },
  Array.isArray(selectionState.allPokemon) ? selectionState.allPokemon : [],
  progressState.setRankingGenerated,
  selectionState.setBattleResults,
  selectionState.setBattlesCompleted,
  selectionState.setBattleHistory,
  progressState.setShowingMilestone,
  progressState.setCompletionPercentage
);



  
  // Synchronize settings state
  if (generationSetting !== generationState.selectedGeneration) {
    generationState.setSelectedGeneration(generationSetting);
  }
  
  // Completion tracking
  const {
    calculateCompletionPercentage,
    getBattlesRemaining
  } = useCompletionTracker(
    selectionState.allPokemon,
    selectionState.battleResults,
    progressState.setRankingGenerated,
    generateRankings,
    progressState.setCompletionPercentage
  );

  // Battle management
  const {
    handleTripletSelectionComplete: completeTripletSelection,
    goBack: navigateBack,
    isProcessingResult
  } = useBattleManager(
    selectionState.battleResults,
    selectionState.setBattleResults,
    selectionState.battlesCompleted,
    selectionState.setBattlesCompleted,
    selectionState.allPokemon,
    selectionState.startNewBattle,
    progressState.setShowingMilestone,
    progressState.milestones,
    generateRankings,
    selectionState.battleHistory,
    selectionState.setBattleHistory,
    selectionState.setSelectedPokemon
  );

  // Battle actions
  const {
    handleContinueBattles,
    handleNewBattleSet
  } = useBattleActions(
    selectionState.allPokemon,
    progressState.setRankingGenerated,
    selectionState.setBattleResults,
    selectionState.setBattlesCompleted,
    selectionState.setBattleHistory,
    progressState.setShowingMilestone,
    progressState.setCompletionPercentage,
    selectionState.startNewBattle,
    generateRankings,
    battleTypeState.battleType
  );

  // Battle interactions
const {
  handlePokemonSelect,
  handleGoBack,
  isProcessing
} = useBattleInteractions(
  selectionState.currentBattle,
  selectionState.setCurrentBattle,
  selectionState.selectedPokemon,
  selectionState.setSelectedPokemon,
  selectionState.battleResults,
  selectionState.setBattleResults,
  selectionState.battlesCompleted,
  selectionState.setBattlesCompleted,
  selectionState.battleHistory,
  selectionState.setBattleHistory,
  () => completeTripletSelection(battleTypeState.battleType, selectionState.currentBattle),
  () => navigateBack(selectionState.setCurrentBattle, battleTypeState.battleType),
 
  
  
  battleTypeState.battleType,
  (selectedPokemonIds: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // ---- basic type‑safety guards ----
    if (
      !Array.isArray(selectedPokemonIds) ||
      selectedPokemonIds.some(id => typeof id !== "number")
    ) {
      throw new Error("selectedPokemonIds must be number[]");
    }
    if (!Array.isArray(currentBattle)) {
      throw new Error("currentBattle must be Pokemon[]");
    }
    // ----------------------------------
    const currentGeneration = generationState.selectedGeneration;
    return selectionState.processBattleResult(
      selectedPokemonIds,
      currentBattle,
      battleType,
      currentGeneration
    );
  }
);



  // Coordinator for state initialization and persistence
  useBattleCoordinatorState(
    isLoading,
    selectionState.allPokemon,
    generationState.selectedGeneration,
    battleTypeState.battleType,
    selectionState.battleResults,
    selectionState.battlesCompleted,
    selectionState.battleHistory,
    progressState.completionPercentage,
    progressState.fullRankingMode,
    saveBattleState,
    loadBattleState,
    // Fix the function signature to match the expected type in useBattleCoordinatorState
async (genId?: number, preserveState?: boolean): Promise<void> => {
  // Fix: Convert genId to number explicitly before passing to loadPokemon
  const generationId = genId !== undefined ? Number(genId) : undefined;
  await loadPokemon(generationId, false, preserveState);
},





    calculateCompletionPercentage
  );

  // Convenience wrappers for component usage
const handleTripletSelectionComplete = () => {
  if (Array.isArray(selectionState.currentBattle)) {
    completeTripletSelection(battleTypeState.battleType, selectionState.currentBattle);
  } else {
    console.error("Expected a Pokémon array but got:", selectionState.currentBattle);
  }
};


  const handleSaveRankings = () => {
    saveRankings(generationState.selectedGeneration);
  };

  const goBack = () => {
    navigateBack(selectionState.setCurrentBattle, battleTypeState.battleType);
  };

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
    isProcessing: isProcessing || isProcessingResult,
    
    // Actions
    setSelectedGeneration: handleGenerationChange,
    handleGenerationChange,
    handleBattleTypeChange,
    setBattleType: handleBattleTypeChange,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSaveRankings,
    handleContinueBattles,
    handleNewBattleSet,
    goBack,
    getBattlesRemaining,
    loadPokemon,
    startNewBattle: selectionState.startNewBattle
  };
};
