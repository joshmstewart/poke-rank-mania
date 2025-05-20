import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleState } from "./useBattleState";
import { useBattleManager } from "./useBattleManager";
import { useRankings } from "./useRankings";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number = 0
) => {
  const {
    battleType,
    currentBattle,
    battlesCompleted,
    battleResults,
    battleHistory,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setCompletionPercentage,
    setRankingGenerated,
    selectedPokemon,
    setSelectedPokemon,
    startNewBattle,
    milestones
  const { battleType, setBattleType } = useBattleTypeSelection();


  const { generateRankings, finalRankings } = useRankings(allPokemon);

  const {
    selectedPokemon: currentSelectedPokemon,
    setSelectedPokemon: updateSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection
  } = useBattleManager(
    currentBattle,
    battleType,
    battleResults,
    battlesCompleted,
    setBattleResults,
    setBattlesCompleted,
    allPokemon,
    startNewBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    selectedPokemon
  );

  const goBack = () => {
    console.log("🔄 Go back action triggered");
    setBattleHistory((prev) => prev.slice(0, -1));
  };

  const isProcessingResult = false;

  const rankedPokemon = useMemo(() => {
    return finalRankings.map((ranked) => ({
      ...ranked,
      score: ranked.score || 0,
      count: ranked.count || 0
    }));
  }, [finalRankings]);

  return {
    battleType,
    currentBattle,
    battlesCompleted,
    battleResults,
    battleHistory,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setCompletionPercentage,
    setRankingGenerated,
    selectedPokemon: currentSelectedPokemon,
    setSelectedPokemon: updateSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    rankedPokemon,
    finalRankings: rankedPokemon,
    generateRankings,
    milestones
  };
};
