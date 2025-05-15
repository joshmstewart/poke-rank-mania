import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";
import { useLocalStorage } from "./useLocalStorage";
import { useBattleManager } from "./useBattleManager";
import { useRankings } from "./useRankings";
import { useBattleInitializer } from "./useBattleInitializer";
import { useCompletionTracker } from "./useCompletionTracker";

export * from "./types";

export const useBattleState = () => {
  // State variables
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [fullRankingMode, setFullRankingMode] = useState(false);
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Milestone triggers - show rankings at these battle counts
  const milestones = [10, 25, 50, 100, 200, 500, 1000];
  
  // Hooks
  const { saveBattleState, loadBattleState } = useLocalStorage();
  
  const {
    finalRankings,
    rankingGenerated,
    setRankingGenerated,
    generateRankings,
    handleSaveRankings: saveRankings
  } = useRankings(allPokemon);

  // Function declarations
  // Move startNewBattle function before it's referenced
  const startNewBattle = (pokemonList: Pokemon[]) => {
    if (pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      return;
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
    
    // Get the first 2 or 3 Pokémon based on battle type
    const battleSize = battleType === "pairs" ? 2 : 3;
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  };
  
  const {
    calculateCompletionPercentage,
    getBattlesRemaining: getRemainingBattles
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

  const loadPokemon = async (genId = selectedGeneration, preserveState = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/pokemon?generation=${genId}&full=${fullRankingMode}`);
      if (!response.ok) throw new Error('Failed to fetch Pokémon');
      const pokemon = await response.json();
      setAllPokemon(pokemon);
      
      if (!preserveState) {
        // Reset battle state if not preserving state
        setBattleResults([]);
        setBattlesCompleted(0);
        setRankingGenerated(false);
        setSelectedPokemon([]);
        setBattleHistory([]);
        setShowingMilestone(false);
        setCompletionPercentage(0);
      }
      
      // Start the first battle or continue from previous battle
      if (pokemon.length > 0) {
        startNewBattle(pokemon);
      }
      
      return pokemon;
    } catch (error) {
      console.error('Error loading Pokémon:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved battle state on initial load
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      setSelectedGeneration(savedState.selectedGeneration);
      setBattleType(savedState.battleType);
      setBattleResults(savedState.battleResults || []);
      setBattlesCompleted(savedState.battlesCompleted || 0);
      setBattleHistory(savedState.battleHistory || []);
      setCompletionPercentage(savedState.completionPercentage || 0);
      setFullRankingMode(savedState.fullRankingMode || false);
      
      // We'll load the Pokemon separately based on the saved generation
      loadPokemon(savedState.selectedGeneration, true);
    } else {
      loadPokemon();
    }
  }, []);

  useEffect(() => {
    // Only reload Pokemon if generation changes
    if (!isLoading) {
      loadPokemon();
    }
  }, [selectedGeneration, fullRankingMode]);

  useEffect(() => {
    // Calculate completion percentage when battle results change
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
      
      // Save battle state whenever results change
      saveBattleState({
        selectedGeneration,
        battleType,
        battleResults,
        battlesCompleted,
        battleHistory,
        completionPercentage,
        fullRankingMode
      });
    }
  }, [battleResults, allPokemon, selectedGeneration, battleType]);

  const handleGenerationChange = (value: string) => {
    setSelectedGeneration(Number(value));
  };

  const handleBattleTypeChange = (value: string) => {
    setBattleType(value as BattleType);
    // Reset battles and start new one with current Pokémon pool
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Important: Start a new battle with the correct number of Pokémon for the selected battle type
    if (allPokemon.length > 0) {
      // Create a new battle with the correct number of Pokémon
      const battleSize = value === "pairs" ? 2 : 3;
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      setCurrentBattle(shuffled.slice(0, battleSize));
      setSelectedPokemon([]);
    }
  };

  const handlePokemonSelect = (id: number) => {
    selectPokemon(id, battleType, currentBattle);
  };

  const handleTripletSelectionComplete = () => {
    completeTripletSelection(battleType, currentBattle);
  };

  const handleSaveRankings = () => {
    saveRankings(selectedGeneration);
  };

  const handleContinueBattles = () => {
    setShowingMilestone(false);
    startNewBattle(allPokemon);
  };

  const handleNewBattleSet = () => {
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    startNewBattle(allPokemon);
  };

  const goBack = () => {
    navigateBack(setCurrentBattle, battleType);
  };

  const getBattlesRemaining = () => {
    return getRemainingBattles(battleType);
  };

  return {
    isLoading,
    selectedGeneration,
    setSelectedGeneration,
    allPokemon,
    battleType,
    setBattleType,
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
