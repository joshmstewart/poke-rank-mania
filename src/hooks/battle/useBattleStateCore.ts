import { useState, useCallback, useEffect, useRef } from "react";
import { Pokemon, getPokemonList } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useProgressState } from "./useProgressState";
import { useBattleProcessor } from "./useBattleProcessor";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";

export const useBattleStateCore = (allPokemon: Pokemon[], initialBattleType: BattleType, initialSelectedGeneration: number) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number>(initialSelectedGeneration);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>(allPokemon);
  const battleTypeRef = useRef<BattleType>(initialBattleType);

  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones,
    milestoneRef
  } = useProgressState();

  const { finalRankings, confidenceScores, generateRankings, handleSaveRankings } = useRankings(availablePokemon);

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
    availablePokemon
  );

  const [battlesCompleted, setBattlesCompleted] = useState(battleResults.length);

  const { processBattleResult, isProcessingResult, resetMilestoneInProgress } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    availablePokemon,
    setCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon
  );

  const processorRefs = useRef({ resetMilestoneInProgress }).current;

  useEffect(() => {
    battleTypeRef.current = initialBattleType;
  }, [initialBattleType]);

  const handlePokemonSelect = useCallback((pokemonId: number) => {
    setSelectedPokemon(prev => {
      if (prev.includes(pokemonId)) {
        return prev.filter(id => id !== pokemonId);
      } else {
        return [...prev, pokemonId];
      }
    });
  }, []);

  const handleTripletSelectionComplete = useCallback((selectedIds: number[]) => {
    if (selectedIds.length !== 1) {
      console.warn("Must select exactly one Pokemon when completing a triplet selection.");
      return;
    }
    
    handleSelection(selectedIds);
  }, [handleSelection]);

  const handleSelection = useCallback(async (selectedPokemonIds: number[]) => {
    setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemonIds }]);
    await processBattleResult(selectedPokemonIds, currentBattle, battleTypeRef.current, selectedGeneration);
  }, [currentBattle, selectedGeneration, processBattleResult, setBattleHistory]);

  const goBack = useCallback(async () => {
    if (battleHistory.length === 0) return;

    setShowingMilestone(false);
    resetMilestoneInProgress?.();

    const lastBattle = battleHistory[battleHistory.length - 1];
    setBattleHistory(prev => prev.slice(0, -1));
    setBattleResults(prev => {
      const updatedResults = prev.slice(0, -currentBattle.length);
      return updatedResults;
    });
    setBattlesCompleted(prev => Math.max(0, prev - currentBattle.length));
    setCurrentBattle(lastBattle.battle);
    setSelectedPokemon(lastBattle.selected);
  }, [battleHistory, currentBattle, resetMilestoneInProgress, setShowingMilestone, setBattleResults, setBattlesCompleted, setCurrentBattle, setSelectedPokemon]);

  const startNewBattle = useCallback(async (battleType: BattleType) => {
    battleTypeRef.current = battleType;
    const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
    const battleSize = battleType === "triplets" ? 3 : 2;
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  }, [availablePokemon]);

  useEffect(() => {
    const fetchPokemon = async () => {
      const pokemonList = await getPokemonList(selectedGeneration);
      setAvailablePokemon(pokemonList);
    };

    fetchPokemon();
  }, [selectedGeneration]);

  return {
    currentBattle,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType: battleTypeRef.current,
    setBattleType: (type: BattleType) => battleTypeRef.current = type,
    finalRankings,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    processorRefs
  };
};
