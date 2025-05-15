import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";
import { useLocalStorage } from "./useLocalStorage";
import { useBattleManager } from "./useBattleManager";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";
import { usePokemonLoader } from "./usePokemonLoader";
import { useBattleEffects } from "./useBattleEffects";

export * from "./types";

export const useBattleState = () => {
  // State variables
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // Milestone triggers - show rankings at these battle counts
  const milestones = [10, 25, 50, 100, 200, 500, 1000];
  
  // Define startNewBattle function first so it can be passed to other hooks
  const startNewBattle = (pokemonList: Pokemon[]) => {
    if (pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      console.log("Not enough Pokémon for a battle");
      return;
    }
    
    // Track previous Pokémon IDs to avoid repetition
    const previousPokemonIds = currentBattle.map(p => p.id);
    console.log("Previous Pokémon IDs:", previousPokemonIds);
    
    // Create a copy of the pokemon list that excludes the ones we just used
    let availablePokemon = [...pokemonList].filter(p => !previousPokemonIds.includes(p.id));
    
    // If we've filtered out too many, reset the list (this prevents issues with small lists)
    if (availablePokemon.length < 3) {
      console.log("Not enough unique Pokémon left, resetting the pool");
      availablePokemon = [...pokemonList];
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = availablePokemon.sort(() => Math.random() - 0.5);
    
    // Get the first 2 or 3 Pokémon based on battle type
    const battleSize = battleType === "pairs" ? 2 : 3;
    const newBattlePokemon = shuffled.slice(0, battleSize);
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
    setCurrentBattle(newBattlePokemon);
    setSelectedPokemon([]);
  };

  // Now we can use the pokemonLoader hook with the startNewBattle function
  const {
    isLoading,
    loadPokemon
  } = usePokemonLoader(
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    setSelectedPokemon,
    startNewBattle
  );
  
  // Hooks
  const { saveBattleState, loadBattleState } = useLocalStorage();
  
  const {
    finalRankings,
    generateRankings,
    handleSaveRankings: saveRankings
  } = useRankings(allPokemon);
  
  const {
    selectedGeneration,
    fullRankingMode,
    setFullRankingMode,
    handleGenerationChange,
    handleBattleTypeChange
  } = useGenerationSettings(
    startNewBattle,
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage
  );
  
  const {
    calculateCompletionPercentage,
    getBattlesRemaining
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

  const {
    handleContinueBattles,
    handleNewBattleSet
  } = useBattleActions(
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    startNewBattle,
    generateRankings
  );

  // Setup effects
  useBattleEffects(
    isLoading,
    allPokemon,
    selectedGeneration,
    battleType,
    battleResults,
    battlesCompleted,
    battleHistory,
    completionPercentage,
    fullRankingMode,
    saveBattleState,
    loadBattleState,
    loadPokemon,
    calculateCompletionPercentage
  );

  const handlePokemonSelect = (id: number) => {
    selectPokemon(id, battleType, currentBattle);
  };

  const handleTripletSelectionComplete = () => {
    completeTripletSelection(battleType, currentBattle);
  };

  const handleSaveRankings = () => {
    saveRankings(selectedGeneration);
  };

  const goBack = () => {
    navigateBack(setCurrentBattle, battleType);
  };

  return {
    isLoading,
    selectedGeneration,
    setSelectedGeneration: handleGenerationChange,
    allPokemon,
    battleType,
    setBattleType: handleBattleTypeChange,
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
