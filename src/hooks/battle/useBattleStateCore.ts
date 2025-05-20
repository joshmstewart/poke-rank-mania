import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleState } from "./useBattleState";
import { useBattleManager } from "./useBattleManager";
import { useRankings } from "./useRankings";
import { useBattleTypeSelection } from "./useBattleTypeSelection";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number = 0
) => {
  const { battleType, setBattleType } = useBattleTypeSelection(initialBattleType);

  const {
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
  } = useBattleState(allPokemon, initialBattleType, initialSelectedGeneration);

  const { finalRankings, generateRankings } = useRankings(allPokemon);

  const {
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

  const rankedPokemon = useMemo(() => {
    return finalRankings.map((ranked) => ({
      ...ranked,
      score: ranked.score || 0,
      count: ranked.count || 0
    }));
  }, [finalRankings]);

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
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setCompletionPercentage,
    setRankingGenerated,
    selectedPokemon,
    setSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    rankedPokemon,
    finalRankings: rankedPokemon,
    generateRankings,
    milestones
  };
};
