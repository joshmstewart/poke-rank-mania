import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarter = () => {
  // Track previous battles to avoid repetition
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);
  // Use ref to track the most recent battle Pokemon IDs for immediate comparison
  const lastBattleRef = useRef<number[]>([]);
  // Track seen Pokemon IDs to avoid repeating the same Pokemon too frequently
  const recentlySeenPokemon = useRef<Set<number>>(new Set());

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
    console.log("Last battle IDs:", lastBattleIds);
    
    // Get the recently seen Pokemon IDs
    const seenPokemonIds = Array.from(recentlySeenPokemon.current);
    
    // CRITICAL: Filter out the Pokemon from the last battle to avoid repetition
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
        
        // Still try to avoid the last battle's Pokemon if possible
        const preferredPokemon = availablePokemon.filter(p => !lastBattleIds.includes(p.id));
        if (preferredPokemon.length >= battleSize) {
          availablePokemon = preferredPokemon;
        }
      }
    }
    
    // Also try to avoid recently seen Pokemon (beyond just the last battle)
    if (seenPokemonIds.length > 0 && availablePokemon.length > battleSize * 3) {
      // Prefer Pokemon that haven't been seen recently
      const preferredPokemon = availablePokemon.filter(p => !seenPokemonIds.includes(p.id));
      
      if (preferredPokemon.length >= battleSize) {
        availablePokemon = preferredPokemon;
      }
    }
    
    // Shuffle the list to get random Pokémon - use a more random shuffle
    const shuffled = availablePokemon.sort(() => 0.5 - Math.random());
    
    // Get the first N Pokémon based on battle type
    let newBattlePokemon = shuffled.slice(0, battleSize);
    
    // Double-check to ensure we don't get the exact same battle
    if (lastBattleIds.length > 0) {
      // Extract IDs from the new battle Pokemon
      const newBattleIds = newBattlePokemon.map(p => p.id).sort();
      const sortedLastIds = [...lastBattleIds].sort();
      
      // Check if the new battle contains exactly the same Pokemon (regardless of order)
      const isSameBattle = newBattleIds.length === sortedLastIds.length && 
        newBattleIds.every((id, i) => id === sortedLastIds[i]);
      
      if (isSameBattle) {
        console.log("Still got the same Pokemon, forcing different selection...");
        
        // Force a completely different selection
        if (shuffled.length > battleSize * 2) {
          newBattlePokemon = shuffled.slice(battleSize, battleSize * 2);
        } else {
          // Last resort - just take a new random selection from the full list
          newBattlePokemon = [...pokemonList]
            .sort(() => 0.5 - Math.random())
            .slice(0, battleSize);
            
          // Ensure at least one Pokemon is different from last battle
          const forceNewIndex = Math.floor(Math.random() * battleSize);
          let replacementOptions = pokemonList.filter(p => !lastBattleIds.includes(p.id));
          
          if (replacementOptions.length > 0) {
            const forcedDifferentPokemon = replacementOptions[Math.floor(Math.random() * replacementOptions.length)];
            newBattlePokemon[forceNewIndex] = forcedDifferentPokemon;
          }
        }
      }
    }
    
    // Save this battle to track and avoid repetition
    const newBattleIds = newBattlePokemon.map(p => p.id);
    setPreviousBattles(prev => [...prev, newBattleIds].slice(-10)); // Keep only the last 10 battles
    
    // Update the ref with current battle IDs for immediate use in next battle
    lastBattleRef.current = newBattleIds;
    
    // Add these Pokemon to the recently seen set (keep only the last 20 Pokemon)
    newBattleIds.forEach(id => {
      recentlySeenPokemon.current.add(id);
      if (recentlySeenPokemon.current.size > 20) {
        // Remove the oldest Pokemon from the set
        recentlySeenPokemon.current.delete(Array.from(recentlySeenPokemon.current)[0]);
      }
    });
    
    console.log("New battle Pokémon:", newBattlePokemon.map(p => p.name));
    return newBattlePokemon;
  };

  return { startNewBattle };
};
