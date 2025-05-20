import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useBattleState } from "./useBattleState";
import { useBattleProcessor } from "./useBattleProcessor";
import { useBattleSelectionManager } from "./useBattleSelectionManager";
import { useCompletionTracker } from "./useCompletionTracker";
import { useRankings } from "./useRankings";
import { BattleType } from "./types";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType = "pairs",
  initialSelectedGeneration = 0
) => {
  const state = useBattleState();
  const {
    currentBattle, setCurrentBattle,
    battlesCompleted, setBattlesCompleted,
    battleResults, setBattleResults,
    battleHistory, setBattleHistory,
    showingMilestone, setShowingMilestone,
    selectedGeneration, setSelectedGeneration,
    completionPercentage, setCompletionPercentage,
    rankingGenerated, setRankingGenerated,
    selectedPokemon, setSelectedPokemon,
    battleType, setBattleType
  } = state;

  const { generateRankings, finalRankings } = useRankings(allPokemon);
  const { processBattleResult, isProcessingResult } = useBattleProcessor(
    battleResults, setBattleResults, battlesCompleted, setBattlesCompleted, allPokemon,
    setCurrentBattle, setShowingMilestone, generateRankings
  );

  const {
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack
  } = useBattleSelectionManager(processBattleResult, battleType, selectedPokemon, setSelectedPokemon, currentBattle);

  const startNewBattle = useCallback(() => {
    setRankingGenerated(false);
    setBattlesCompleted(0);
    setBattleResults([]);
    setCurrentBattle([]);
  }, [setRankingGenerated, setBattlesCompleted, setBattleResults, setCurrentBattle]);

  const milestones = [10, 25, 50, 100, 150, 200, 250, 300];
  const { resetMilestones, resetMilestoneRankings, calculateCompletionPercentage, getSnapshotForMilestone } =
    useCompletionTracker(battleResults, setRankingGenerated, setCompletionPercentage, showingMilestone,
      setShowingMilestone, generateRankings, allPokemon);

  return {
    ...state,
    finalRankings,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings
  };
};
