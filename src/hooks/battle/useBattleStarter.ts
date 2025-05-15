
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarter = () => {
  // Track previous battles to avoid repetition
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);

  const startNewBattle = (pokemonList: Pokemon[], battleType: "pairs" | "triplets") => {
    console.log("Starting new battle with pokemonList:", pokemonList?.length || 0);
    
    if (!pokemonList || pokemonList.length < 2) {
      console.error("Not enough Pokémon for a battle:", pokemonList?.length || 0);
      return [];
    }
    
    // Determine battle size based on battle type
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    // Create a copy of the pokemon list
    let availablePokemon = [...pokemonList];
    
    // If we have previous battles, try to avoid repeating the same Pokémon
    if (previousBattles.length > 0) {
      const lastBattleIds = previousBattles[previousBattles.length - 1];
      
      // Filter out recently used Pokemon if we have enough remaining
      const filteredPokemon = availablePokemon.filter(p => !lastBattleIds.includes(p.id));
      
      // Only use filtered list if we have enough Pokémon left
      if (filteredPokemon.length >= battleSize) {
        availablePokemon = filteredPokemon;
      } else {
        console.log("Not enough unique Pokémon left, using full pool");
      }
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = availablePokemon.sort(() => Math.random() - 0.5);
    
    // Get the first N Pokémon based on battle type
    let newBattlePokemon = shuffled.slice(0, battleSize);
    
    // Ensure we don't get the exact same battle
    if (previousBattles.length > 0) {
      const lastBattleIds = previousBattles[previousBattles.length - 1];
      
      // Check if we got the exact same battle as before
      const isSameBattle = newBattlePokemon.length === lastBattleIds.length && 
        newBattlePokemon.every(p => lastBattleIds.includes(p.id)) &&
        lastBattleIds.every(id => newBattlePokemon.some(p => p.id === id));
      
      if (isSameBattle) {
        console.log("Identical battle detected, reshuffling...");
        // Try one more shuffle
        newBattlePokemon = [...pokemonList]
          .sort(() => Math.random() - 0.5)
          .slice(0, battleSize);
      }
    }
    
    // Save this battle to avoid repetition
    setPreviousBattles(prev => [
      ...prev, 
      newBattlePokemon.map(p => p.id)
    ].slice(-5)); // Keep only the last 5 battles
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
    return newBattlePokemon;
  };

  return { startNewBattle };
};
