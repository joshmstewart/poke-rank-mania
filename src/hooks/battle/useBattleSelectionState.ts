
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { useBattleStarter } from "./useBattleStarter";

export const useBattleSelectionState = () => {
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [currentBattleType, setCurrentBattleType] = useState<BattleType>(
    (storedBattleType as BattleType) || "pairs"
  );

  const { startNewBattle: initiateNewBattle } = useBattleStarter();
  
  // Update local battle type when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
      if (newBattleType && newBattleType !== currentBattleType) {
        setCurrentBattleType(newBattleType);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentBattleType]);
  
  // Define startNewBattle function
  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType = "pairs") => {
    console.log("useBattleSelectionState - startNewBattle with pokemonList length:", pokemonList?.length || 0);
    
    if (!pokemonList || pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      console.log("Not enough Pokémon for a battle:", pokemonList?.length || 0);
      return;
    }
    
    setCurrentBattleType(battleType);
    localStorage.setItem('pokemon-ranker-battle-type', battleType);
    
    const newBattlePokemon = initiateNewBattle(pokemonList, battleType);
    if (newBattlePokemon && newBattlePokemon.length > 0) {
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
    startNewBattle
  };
};
