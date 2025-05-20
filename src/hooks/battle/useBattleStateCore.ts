
import { useState, useCallback, useEffect, useRef } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
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

  // This is our main handlePokemonSelect function that will be passed to components
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    // Prevent multiple rapid clicks by checking if we're already processing
    if (isProcessingResult) {
      console.log("Ignoring selection while processing previous result");
      return;
    }
    
    setSelectedPokemon(prev => {
      // For pairs mode, select and process immediately
      if (battleTypeRef.current === "pairs") {
        const newSelected = [pokemonId];
        
        // Save to battle history before processing
        setBattleHistory(prevHistory => [...prevHistory, { 
          battle: currentBattle, 
          selected: newSelected 
        }]);
        
        // Process battle immediately for pairs mode
        setTimeout(() => {
          processBattleResult(newSelected, currentBattle, battleTypeRef.current, selectedGeneration);
        }, 50);
        
        return newSelected;
      }
      
      // For triplets mode, just update the selected state
      if (prev.includes(pokemonId)) {
        return prev.filter(id => id !== pokemonId);
      } else {
        return [...prev, pokemonId];
      }
    });
  }, [currentBattle, selectedGeneration, processBattleResult, setBattleHistory, isProcessingResult]);

  // Define handleSelection before it's used
  const handleSelection = useCallback(async (selectedPokemonIds: number[]) => {
    if (isProcessingResult) return;
    
    setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemonIds }]);
    await processBattleResult(selectedPokemonIds, currentBattle, battleTypeRef.current, selectedGeneration);
  }, [currentBattle, selectedGeneration, processBattleResult, setBattleHistory, isProcessingResult]);

  // Make handleTripletSelectionComplete accept no arguments to match the expected interface
  const handleTripletSelectionComplete = useCallback(() => {
    if (isProcessingResult) return;
    
    if (selectedPokemon.length === 0) {
      console.warn("No Pokemon selected for triplet selection.");
      return;
    }
    
    handleSelection(selectedPokemon);
  }, [handleSelection, selectedPokemon, isProcessingResult]);

  const goBack = useCallback(async () => {
    if (battleHistory.length === 0 || isProcessingResult) return;

    setShowingMilestone(false);
    resetMilestoneInProgress?.();

    const lastBattle = battleHistory[battleHistory.length - 1];
    setBattleHistory(prev => prev.slice(0, -1));
    setBattleResults(prev => {
      const updatedResults = prev.slice(0, -1);
      return updatedResults;
    });
    setBattlesCompleted(prev => Math.max(0, prev - 1));
    setCurrentBattle(lastBattle.battle);
    setSelectedPokemon(lastBattle.selected);
  }, [battleHistory, resetMilestoneInProgress, setShowingMilestone, setBattleResults, setBattlesCompleted, isProcessingResult]);

  const startNewBattle = useCallback(async (battleType: BattleType) => {
    battleTypeRef.current = battleType;
    const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
    const battleSize = battleType === "triplets" ? 3 : 2;
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  }, [availablePokemon]);

  useEffect(() => {
    const fetchPokemon = async () => {
      const pokemonList = await fetchAllPokemon(selectedGeneration);
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
    handlePokemonSelect, // Make sure this is included in the return object
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
    processorRefs,
    battleHistory // Add the battleHistory to the return object
  };
};
