
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
import { BattleType } from "./types";

export * from "./types";

export const useBattleState = () => {
  // Use our new custom hooks
  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    battleType,
    setBattleType,
    fullRankingMode,
    setFullRankingMode,
    selectedGeneration,
    setSelectedGeneration,
    milestones
  } = useBattleUIState();

  const {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    startNewBattle
  } = useBattleSelectionState();

  // Use the existing hooks with our state
  const {
    isLoading,
    loadPokemon
  } = usePokemonLoader(
    setAllPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    setSelectedPokemon,
    startNewBattle,
    battleType
  );
  
  const { saveBattleState, loadBattleState } = useLocalStorage();
  
  const {
    finalRankings,
    generateRankings,
    handleSaveRankings: saveRankings
  } = useRankings(allPokemon);
  
  const {
    selectedGeneration: generationSetting,
    fullRankingMode: rankingModeSetting,
    handleGenerationChange,
    handleBattleTypeChange
  } = useGenerationSettings(
    startNewBattle,
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
  );
  
  // Update state from settings
  if (generationSetting !== selectedGeneration) {
    setSelectedGeneration(generationSetting);
  }
  if (rankingModeSetting !== fullRankingMode) {
    setFullRankingMode(rankingModeSetting);
  }
  
  const {
    calculateCompletionPercentage,
    getBattlesRemaining
  } = useCompletionTracker(
    allPokemon,
    battleResults,
    setRankingGenerated,
    generateRankings,
    setCompletionPercentage
  );

  const {
    handleTripletSelectionComplete: completeTripletSelection,
    goBack: navigateBack
  } = useBattleManager(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    allPokemon,
    startNewBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    battleHistory,
    setBattleHistory,
    setSelectedPokemon
  );

  const {
    handleContinueBattles,
    handleNewBattleSet
  } = useBattleActions(
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    startNewBattle,
    generateRankings,
    battleType
  );

  // Setup battle interactions hook
  const {
    handlePokemonSelect,
    handleGoBack
  } = useBattleInteractions(
    currentBattle,
    setCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    () => completeTripletSelection(battleType, currentBattle),
    () => navigateBack(setCurrentBattle, battleType),
    battleType
  );

  // Setup initialization effects
  useBattleStateInitializer(
    isLoading,
    allPokemon,
    selectedGeneration,
    battleType,
    fullRankingMode,
    loadBattleState,
    loadPokemon
  );

  // Setup persistence effects
  useBattlePersistence(
    allPokemon,
    selectedGeneration,
    battleType,
    battleResults,
    battlesCompleted,
    battleHistory,
    completionPercentage,
    fullRankingMode,
    saveBattleState,
    calculateCompletionPercentage
  );

  const handleTripletSelectionComplete = () => {
    completeTripletSelection(battleType, currentBattle);
  };

  const handleSaveRankings = () => {
    saveRankings(selectedGeneration);
  };

  const goBack = () => {
    navigateBack(setCurrentBattle, battleType);
  };

  return {
    isLoading,
    selectedGeneration,
    setSelectedGeneration: handleGenerationChange,
    allPokemon,
    battleType,
    setBattleType: handleBattleTypeChange,
    currentBattle,
    battleResults,
    selectedPokemon,
    battlesCompleted,
    rankingGenerated,
    finalRankings,
    battleHistory,
    showingMilestone,
    completionPercentage,
    fullRankingMode,
    setFullRankingMode,
    milestones,
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
    startNewBattle
  };
};
