
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { useBattleStarter } from "./useBattleStarter";

export const useBattleSelectionState = () => {
  // Get initial value from localStorage
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const initialBattleType = (storedBattleType === "triplets") ? "triplets" : "pairs";
  console.log("useBattleSelectionState initialized with battleType:", initialBattleType);
  
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [currentBattleType, setCurrentBattleType] = useState<BattleType>(initialBattleType);

  // Pass setCurrentBattle to useBattleStarter
  const { startNewBattle: initiateNewBattle } = useBattleStarter(setCurrentBattle);
  
  // Listen for changes to the battle type in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
      if (newBattleType && (newBattleType === "pairs" || newBattleType === "triplets") && newBattleType !== currentBattleType) {
        console.log("useBattleSelectionState: Detected battle type change in localStorage:", newBattleType);
        setCurrentBattleType(newBattleType);
      }
    };
    
    // Check immediately and then on storage events
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentBattleType]);
  
  // Define startNewBattle function
  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType = currentBattleType) => {
    console.log("useBattleSelectionState - startNewBattle with pokemonList length:", pokemonList?.length || 0, "and battleType:", battleType);
    
    if (!pokemonList || pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      console.log("Not enough Pokémon for a battle:", pokemonList?.length || 0);
      return;
    }
    
    // Update our current battle type if different
    if (battleType !== currentBattleType) {
      console.log("Updating currentBattleType to:", battleType);
      setCurrentBattleType(battleType);
      
      // Force update localStorage
      localStorage.setItem('pokemon-ranker-battle-type', battleType);
    }
    
    // Start the new battle
    console.log("Starting new battle with pokemonList:", pokemonList.length);
    const newBattlePokemon = initiateNewBattle(pokemonList, battleType);
    if (newBattlePokemon && newBattlePokemon.length > 0) {
      console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
      console.log("Setting current battle to:", newBattlePokemon.map(p => p.name));
      setCurrentBattle(newBattlePokemon);
      setSelectedPokemon([]);
    } else {
      console.error("Failed to create new battle - no pokemon returned");
    }
  };

  return {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    startNewBattle,
    currentBattleType
  };
};
