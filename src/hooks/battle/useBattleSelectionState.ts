
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { useBattleStarter } from "./useBattleStarter";
import { useBattleProcessor } from "./useBattleProcessor";

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

  // Get current ranking from battle results if available
  const getCurrentRankings = (): Pokemon[] => {
    if (battleResults.length === 0) return [];
    
    // Create a map of Pokemon by ID, prioritizing winners
    const pokemonMap = new Map<number, Pokemon>();
    
    // Add winners first
    battleResults.forEach(result => {
      if (!pokemonMap.has(result.winner.id)) {
        pokemonMap.set(result.winner.id, result.winner);
      }
    });
    
    // Add any losers that aren't already in the map
    battleResults.forEach(result => {
      if (!pokemonMap.has(result.loser.id)) {
        pokemonMap.set(result.loser.id, result.loser);
      }
    });
    
    // Convert map to array
    return Array.from(pokemonMap.values());
  };

  // Create a battleStarter instance with the needed parameters
// At the top, get the starter function with a different name
const { startNewBattle: startBattleFromHook } = useBattleStarter(
  allPokemon,
  allPokemon,
  getCurrentRankings(),
  setCurrentBattle
);


  
  // Create a processBattleResult function to expose to other hooks
  const processBattleResult = (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType = currentBattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (selectedPokemonIds.length === 0 || !currentBattlePokemon || currentBattlePokemon.length === 0) {
      return;
    }
    
    // For pairs battle
    if (battleType === "pairs") {
      const winner = currentBattlePokemon.find(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattlePokemon.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winner && loser) {
        setBattleResults(prev => [...prev, { winner, loser }]);
      }
    } 
    // For triplets battle
    else {
      const winners = currentBattlePokemon.filter(p => selectedPokemonIds.includes(p.id));
      const losers = currentBattlePokemon.filter(p => !selectedPokemonIds.includes(p.id));
      
      if (winners.length > 0 && losers.length > 0) {
        setBattleResults(prev => {
          const newResults = [...prev];
          winners.forEach(winner => {
            losers.forEach(loser => {
              newResults.push({ winner, loser });
            });
          });
          return newResults;
        });
      }
    }
  };
  
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
    console.log("Not enough Pokémon for a battle:", pokemonList?.length || 0);
    return;
  }

  if (battleType !== currentBattleType) {
    console.log("Updating currentBattleType to:", battleType);
    setCurrentBattleType(battleType);
    localStorage.setItem('pokemon-ranker-battle-type', battleType);
  }

  if (allPokemon.length === 0 && pokemonList.length > 0) {
    setAllPokemon(pokemonList);
  }

  const newBattlePokemon = startBattleFromHook(battleType); // ✅ use the renamed one

  if (newBattlePokemon && newBattlePokemon.length > 0) {
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
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
    currentBattleType,
    processBattleResult
  };
};
