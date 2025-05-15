
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult } from "./types";

export const useBattleSelectionState = () => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);

  // Define startNewBattle function
  const startNewBattle = (pokemonList: Pokemon[]) => {
    if (!pokemonList || pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      console.log("Not enough Pokémon for a battle:", pokemonList?.length || 0);
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
    
    // Make sure we don't pick the same Pokémon as the previous battle
    availablePokemon = availablePokemon.filter(p => !previousPokemonIds.includes(p.id));
    
    // If after filtering we still don't have enough Pokémon, use the full list but ensure we don't
    // get the exact same battle
    if (availablePokemon.length < 2) {
      console.log("Using full list but avoiding exact same battle");
      availablePokemon = [...pokemonList];
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = availablePokemon.sort(() => Math.random() - 0.5);
    
    // Get the first 2 or 3 Pokémon based on battle type
    const battleSize = 2; // default to pairs, will be updated when battle type is known
    let newBattlePokemon = shuffled.slice(0, battleSize);
    
    // Check if we got the exact same battle as before
    if (battleSize === previousPokemonIds.length && 
        newBattlePokemon.every(p => previousPokemonIds.includes(p.id)) &&
        previousPokemonIds.every(id => newBattlePokemon.some(p => p.id === id))) {
      console.log("Identical battle detected, reshuffling...");
      // Try one more shuffle
      newBattlePokemon = [...pokemonList]
        .sort(() => Math.random() - 0.5)
        .slice(0, battleSize);
    }
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
    setCurrentBattle(newBattlePokemon);
    setSelectedPokemon([]);
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
