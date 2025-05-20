import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useRankings, RankedPokemon } from "./useRankings";
import { useProgressState } from "./useProgressState";
import { useCompletionTracker } from "./useCompletionTracker";
import { usePokemonLoader } from "./usePokemonLoader";

export const useBattleState = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number = 0
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState<number>(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [rankingGenerated, setRankingGenerated] = useState(false);

  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    milestones
  } = useProgressState();

  const { finalRankings, generateRankings } = useRankings(allPokemon);

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

  const { loadPokemon } = usePokemonLoader(
  setCurrentBattle,
  setRankingGenerated,
  setBattlesCompleted,
  setBattleResults,
  setBattleHistory,
  setShowingMilestone,
  setCompletionPercentage,
  setSelectedPokemon,
  initialBattleType
);


  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [currentBattleType, setCurrentBattleType] = useState(initialBattleType);

  const startNewBattle = useCallback(() => {
    loadPokemon(selectedGeneration, true, false);
  }, [selectedGeneration, loadPokemon]);

  return {
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
  };
};
