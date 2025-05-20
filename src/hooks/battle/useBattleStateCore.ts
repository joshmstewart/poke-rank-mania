import { useBattleState } from "./useBattleState";
import { useBattleTypeSelection } from "./useBattleTypeSelection";
import { useBattleSelectionManager } from "./useBattleSelectionManager";
import { BattleType } from "./types";

export const useBattleStateCore = () => {
  const initialBattleType: BattleType = "pairs";
  const initialSelectedGeneration = 0;

  const {
    currentBattle,
    battlesCompleted,
    battleResults,
    battleHistory,
    selectedPokemon,
    setSelectedPokemon,
    rankingGenerated,
    setRankingGenerated,
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    milestones,
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    finalRankings,
    generateRankings,
    selectedGeneration,
    setSelectedGeneration,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    startNewBattle,
    currentBattleType,
    setCurrentBattleType,
  } = useBattleState([], initialBattleType, initialSelectedGeneration);

  const { battleType, setBattleType } = useBattleTypeSelection(initialBattleType);

  const {
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
  } = useBattleSelectionManager(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    [],
    startNewBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon,
    currentBattleType,
    selectedGeneration
  );

  return {
    battleType,
    setBattleType,
    currentBattle,
    battlesCompleted,
    battleResults,
    battleHistory,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    rankingGenerated,
    setRankingGenerated,
    completionPercentage,
    setCompletionPercentage,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    selectedPokemon,
    setSelectedPokemon,
    startNewBattle,
    milestones,
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    finalRankings,
    generateRankings,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
  };
};
