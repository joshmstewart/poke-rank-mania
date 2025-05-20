
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
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    allPokemon,
    setCurrentBattle,
    setShowingMilestone,
    [10, 25, 50, 100, 150, 200, 250, 300],
    generateRankings,
    setSelectedPokemon
  );

  const {
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack
  } = useBattleSelectionManager(
    processBattleResult,
    battleType,
    selectedPokemon,
    setSelectedPokemon,
    currentBattle,
    setCurrentBattle,
    battleHistory,
    setBattleHistory,
    battlesCompleted,
    setBattlesCompleted
  );

  const startNewBattle = useCallback((type: BattleType = battleType) => {
    console.log("Starting new battle with type:", type);
    setBattleType(type);
    setRankingGenerated(false);
    setBattlesCompleted(0);
    setBattleResults([]);
    
    // Create a new shuffled battle
    const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
    const battleSize = type === "triplets" ? 3 : 2;
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  }, [
    allPokemon,
    battleType,
    setBattleType,
    setRankingGenerated,
    setBattlesCompleted,
    setBattleResults,
    setCurrentBattle,
    setSelectedPokemon
  ]);

  const {
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  } = useCompletionTracker(
    battleResults,
    setRankingGenerated,
    setCompletionPercentage,
    showingMilestone,
    setShowingMilestone,
    generateRankings,
    allPokemon
  );

  return {
    ...state,
    finalRankings,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    startNewBattle,
    milestones: [10, 25, 50, 100, 150, 200, 250, 300],
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings
  };
};
