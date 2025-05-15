
import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarter = () => {
  // Track previous battles to avoid repetition
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);
  // Use ref to track the most recent battle Pokemon IDs for immediate comparison
  const lastBattleRef = useRef<number[]>([]);

  const startNewBattle = (pokemonList: Pokemon[], battleType: "pairs" | "triplets") => {
    console.log("Starting new battle with pokemonList:", pokemonList?.length || 0);
    
    if (!pokemonList || pokemonList.length < 3) { // Need at least 3 for rotation
      console.error("Not enough Pokémon for a battle:", pokemonList?.length || 0);
      return [];
    }
    
    // Determine battle size based on battle type
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    // Create a copy of the pokemon list
    let availablePokemon = [...pokemonList];
    
    // Get the last battle Pokemon IDs from ref for immediate comparison
    const lastBattleIds = lastBattleRef.current;
    
    // IMPORTANT: Filter out the Pokemon from the last battle to avoid repetition
    if (lastBattleIds.length > 0) {
      console.log("Filtering out previously used Pokemon:", lastBattleIds);
      
      // Strictly filter out Pokemon that were in the last battle
      availablePokemon = availablePokemon.filter(p => !lastBattleIds.includes(p.id));
      
      // Ensure we have enough Pokemon left
      if (availablePokemon.length < battleSize) {
        console.log("Not enough unique Pokémon left after filtering, using shuffle strategy");
        
        // If we don't have enough Pokemon after filtering, use the full list but ensure
        // we don't get the exact same combination as before
        availablePokemon = [...pokemonList];
      }
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = availablePokemon.sort(() => Math.random() - 0.5);
    
    // Get the first N Pokémon based on battle type
    let newBattlePokemon = shuffled.slice(0, battleSize);
    
    // Double-check to ensure we don't get the exact same battle
    if (lastBattleIds.length > 0) {
      // Extract IDs from the new battle Pokemon
      const newBattleIds = newBattlePokemon.map(p => p.id);
      
      // Check if the new battle contains exactly the same Pokemon (regardless of order)
      const isSameBattle = newBattleIds.length === lastBattleIds.length && 
        newBattleIds.every(id => lastBattleIds.includes(id));
      
      if (isSameBattle) {
        console.log("Still got the same Pokemon, forcing different selection...");
        
        // Force a different selection by taking different Pokemon from the shuffled array
        // Use the next set in the shuffled array if available
        if (shuffled.length > battleSize * 2) {
          newBattlePokemon = shuffled.slice(battleSize, battleSize * 2);
        } else {
          // Last resort - just take a new random selection from the full list
          newBattlePokemon = [...pokemonList]
            .sort(() => Math.random() - 0.5)
            .filter(p => !lastBattleIds.includes(p.id))
            .slice(0, battleSize);
            
          // If we still don't have enough, just get any that aren't all the same
          if (newBattlePokemon.length < battleSize) {
            newBattlePokemon = [...pokemonList]
              .sort(() => Math.random() - 0.5)
              .slice(0, battleSize);
          }
        }
      }
    }
    
    // Save this battle to track and avoid repetition
    const newBattleIds = newBattlePokemon.map(p => p.id);
    setPreviousBattles(prev => [...prev, newBattleIds].slice(-5)); // Keep only the last 5 battles
    
    // Update the ref with current battle IDs for immediate use in next battle
    lastBattleRef.current = newBattleIds;
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
    return newBattlePokemon;
  };

  return { startNewBattle };
};
