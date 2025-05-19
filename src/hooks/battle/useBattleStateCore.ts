
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";
import { useGenerationState } from "./useGenerationState";
import { useBattleTypeState } from "./useBattleTypeState";
import { useProgressState } from "./useProgressState";
import { useBattleSelectionState } from "./useBattleSelectionState";
import { useBattleStateIO } from "./useBattleStateIO";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateCoordinator } from "./useBattleStateCoordinator";
import { useBattleManager } from "./useBattleManager";
import { useCompletionTracker } from "./useCompletionTracker";
import { useConfidenceRanking } from "./useConfidenceRanking";

export const useBattleStateCore = () => {
  const generationState = useGenerationState();
  const battleTypeState = useBattleTypeState();
  const progressState = useProgressState();
  const selectionState = useBattleSelectionState();

  const allPokemonSafe = Array.isArray(selectionState.allPokemon) && selectionState.allPokemon.length > 0
    ? selectionState.allPokemon
    : [];

  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType) => {
    if (!pokemonList || pokemonList.length < 2) return;

    if (allPokemonSafe.length === 0 && pokemonList.length > 0) {
      selectionState.setAllPokemon(pokemonList);
    }

    const battleSize = battleType === "triplets" ? 3 : 2;
    if (pokemonList.length >= battleSize) {
      const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
      const battlePokemon = shuffled.slice(0, battleSize);
      selectionState.setCurrentBattle(battlePokemon);
    }
  };

  const startNewBattleAdapter = (battleType: BattleType) => {
    if (allPokemonSafe && allPokemonSafe.length >= 2) {
      startNewBattle(allPokemonSafe, battleType);
    }
  };

  const {
    isLoading,
    loadPokemon,
    saveBattleState,
    loadBattleState,
    finalRankings,
    generateRankings,
    handleSaveRankings,
    getBattlesRemaining
  } = useBattleStateIO({
    setAllPokemon: selectionState.setAllPokemon,
    setRankingGenerated: progressState.setRankingGenerated,
    setBattleResults: selectionState.setBattleResults,
    setBattlesCompleted: selectionState.setBattlesCompleted,
    setBattleHistory: selectionState.setBattleHistory,
    setShowingMilestone: progressState.setShowingMilestone,
    setCompletionPercentage: progressState.setCompletionPercentage,
    setSelectedPokemon: selectionState.setSelectedPokemon,
    startNewBattle,
    battleType: battleTypeState.battleType,
    allPokemon: allPokemonSafe,
    battleResults: selectionState.battleResults
  });

  // SEPARATED HOOK #1: Completion tracker (only tracks battle completion % and milestones)
  const {
    calculateCompletionPercentage,
    resetMilestones,
    getSnapshotForMilestone
  } = useCompletionTracker(
    selectionState.battleResults,
    progressState.setRankingGenerated,
    progressState.setCompletionPercentage,
    progressState.setShowingMilestone,
    generateRankings,
    allPokemonSafe
  );

  // SEPARATED HOOK #2: Confidence ranking (only handles confidence scores for ranking Pokémon)
  const {
    confidenceScores,
    calculateConfidenceScores,
    getConfidentRankedPokemon,
    getOverallRankingProgress
  } = useConfidenceRanking();

  // Update confidence scores whenever rankings change
  if (finalRankings && finalRankings.length > 0) {
    calculateConfidenceScores(finalRankings);
  }

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

  const confidentRankedPokemon = getConfidentRankedPokemon(finalRankings, 0.8);

  return {
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
    startNewBattle: startNewBattleAdapter,
    confidentRankedPokemon,
    confidenceScores,
    resetMilestones,
    getSnapshotForMilestone
  };
};
