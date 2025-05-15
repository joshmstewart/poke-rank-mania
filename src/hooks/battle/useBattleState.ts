
import { useBattleUIState } from "./useBattleUIState";
import { useBattleSelectionState } from "./useBattleSelectionState";
import { usePokemonLoader } from "./usePokemonLoader";
import { useLocalStorage } from "./useLocalStorage";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";
import { useBattleManager } from "./useBattleManager";
import { useBattleEffects } from "./useBattleEffects";

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
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    setSelectedPokemon,
    startNewBattle
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
    handlePokemonSelect: selectPokemon,
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
    generateRankings
  );

  // Setup effects
  useBattleEffects(
    isLoading,
    allPokemon,
    selectedGeneration,
    battleType,
    battleResults,
    battlesCompleted,
    battleHistory,
    completionPercentage,
    fullRankingMode,
    saveBattleState,
    loadBattleState,
    loadPokemon,
    calculateCompletionPercentage
  );

  const handlePokemonSelect = (id: number) => {
    selectPokemon(id, battleType, currentBattle);
  };

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
