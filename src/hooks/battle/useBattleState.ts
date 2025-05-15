
import { useBattleUIState } from "./useBattleUIState";
import { useBattleSelectionState } from "./useBattleSelectionState";
import { usePokemonLoader } from "./usePokemonLoader";
import { useLocalStorage } from "./useLocalStorage";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";
import { useBattleManager } from "./useBattleManager";
import { useBattleStateInitializer } from "./useBattleStateInitializer";
import { useBattlePersistence } from "./useBattlePersistence";
import { useBattleInteractions } from "./useBattleInteractions";
import { useBattleCoordinator } from "./useBattleCoordinator";
import { BattleType } from "./types";

export * from "./types";

export const useBattleState = () => {
  // Use our custom hooks for state management
  const uiState = useBattleUIState();
  const selectionState = useBattleSelectionState();
  
  // Use the existing hooks with our state
  const {
    isLoading,
    loadPokemon
  } = usePokemonLoader(
    selectionState.setAllPokemon,
    uiState.setRankingGenerated,
    selectionState.setBattleResults,
    selectionState.setBattlesCompleted,
    selectionState.setBattleHistory,
    uiState.setShowingMilestone,
    uiState.setCompletionPercentage,
    selectionState.setSelectedPokemon,
    selectionState.startNewBattle,
    uiState.battleType
  );
  
  const { saveBattleState, loadBattleState } = useLocalStorage();
  
  const {
    finalRankings,
    generateRankings,
    handleSaveRankings: saveRankings
  } = useRankings(selectionState.allPokemon);
  
  const {
    selectedGeneration: generationSetting,
    fullRankingMode: rankingModeSetting,
    handleGenerationChange,
    handleBattleTypeChange,
    setFullRankingMode: handleRankingModeChange
  } = useGenerationSettings(
    selectionState.startNewBattle,
    selectionState.allPokemon,
    uiState.setRankingGenerated,
    selectionState.setBattleResults,
    selectionState.setBattlesCompleted,
    selectionState.setBattleHistory,
    uiState.setShowingMilestone,
    uiState.setCompletionPercentage,
  );
  
  // Synchronize settings state
  if (generationSetting !== uiState.selectedGeneration) {
    uiState.setSelectedGeneration(generationSetting);
  }
  if (rankingModeSetting !== uiState.fullRankingMode) {
    uiState.setFullRankingMode(rankingModeSetting);
  }
  
  const {
    calculateCompletionPercentage,
    getBattlesRemaining
  } = useCompletionTracker(
    selectionState.allPokemon,
    selectionState.battleResults,
    uiState.setRankingGenerated,
    generateRankings,
    uiState.setCompletionPercentage
  );

  const {
    handleTripletSelectionComplete: completeTripletSelection,
    goBack: navigateBack
  } = useBattleManager(
    selectionState.battleResults,
    selectionState.setBattleResults,
    selectionState.battlesCompleted,
    selectionState.setBattlesCompleted,
    selectionState.allPokemon,
    selectionState.startNewBattle,
    uiState.setShowingMilestone,
    uiState.milestones,
    generateRankings,
    selectionState.battleHistory,
    selectionState.setBattleHistory,
    selectionState.setSelectedPokemon
  );

  const {
    handleContinueBattles,
    handleNewBattleSet
  } = useBattleActions(
    selectionState.allPokemon,
    uiState.setRankingGenerated,
    selectionState.setBattleResults,
    selectionState.setBattlesCompleted,
    selectionState.setBattleHistory,
    uiState.setShowingMilestone,
    uiState.setCompletionPercentage,
    selectionState.startNewBattle,
    generateRankings,
    uiState.battleType
  );

  // Setup battle interactions hook
  const {
    handlePokemonSelect,
    handleGoBack
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
    () => completeTripletSelection(uiState.battleType, selectionState.currentBattle),
    () => navigateBack(selectionState.setCurrentBattle, uiState.battleType),
    uiState.battleType
  );

  // Use our new coordinator hook to setup initialization and persistence effects
  useBattleCoordinator(
    isLoading,
    selectionState.allPokemon,
    uiState.selectedGeneration,
    uiState.battleType,
    selectionState.battleResults,
    selectionState.battlesCompleted,
    selectionState.battleHistory,
    uiState.completionPercentage,
    uiState.fullRankingMode,
    saveBattleState,
    loadBattleState,
    loadPokemon,
    calculateCompletionPercentage
  );

  const handleTripletSelectionComplete = () => {
    completeTripletSelection(uiState.battleType, selectionState.currentBattle);
  };

  const handleSaveRankings = () => {
    saveRankings(uiState.selectedGeneration);
  };

  const goBack = () => {
    navigateBack(selectionState.setCurrentBattle, uiState.battleType);
  };

  return {
    isLoading,
    selectedGeneration: uiState.selectedGeneration,
    setSelectedGeneration: handleGenerationChange,
    allPokemon: selectionState.allPokemon,
    battleType: uiState.battleType,
    setBattleType: handleBattleTypeChange,
    currentBattle: selectionState.currentBattle,
    battleResults: selectionState.battleResults,
    selectedPokemon: selectionState.selectedPokemon,
    battlesCompleted: selectionState.battlesCompleted,
    rankingGenerated: uiState.rankingGenerated,
    finalRankings,
    battleHistory: selectionState.battleHistory,
    showingMilestone: uiState.showingMilestone,
    completionPercentage: uiState.completionPercentage,
    fullRankingMode: uiState.fullRankingMode,
    setFullRankingMode: handleRankingModeChange,
    milestones: uiState.milestones,
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
    startNewBattle: selectionState.startNewBattle
  };
};
