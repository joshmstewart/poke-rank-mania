
import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarter = (
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  // Track previous battles to avoid repetition
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);
  // Use ref to track the most recent battle Pokemon IDs for immediate comparison
  const lastBattleRef = useRef<number[]>([]);
  // Track seen Pokemon IDs to avoid repeating the same Pokemon too frequently
  const recentlySeenPokemon = useRef<Set<number>>(new Set());
  // Count consecutive repeats to force more variety
  const consecutiveRepeatsRef = useRef(0);

  // Fisher-Yates shuffle algorithm for better randomization
  const shuffleArray = (array: Pokemon[]): Pokemon[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
// Utility function to roll a random number between 0–100
const roll = () => Math.random() * 100;
  // Simulate priority status (e.g., Pokémon in top 25%) using a Set of high IDs
const priorityPokemon = new Set<number>();
const PRIORITY_THRESHOLD = 200; // Adjust this if needed

// We'll mark Pokémon with IDs <= PRIORITY_THRESHOLD as priority
const updatePriorityPokemon = (pokemonList: Pokemon[]) => {
  priorityPokemon.clear();
  const sorted = [...pokemonList].sort((a, b) => a.id - b.id);
  const topCount = Math.floor(sorted.length * 0.25);
  sorted.slice(0, topCount).forEach(p => priorityPokemon.add(p.id));
};



  const startNewBattle = (pokemonList: Pokemon[], battleType: "pairs" | "triplets") => {
    console.log("Starting new battle with pokemonList:", pokemonList?.length || 0);

    updatePriorityPokemon(pokemonList);
    let availablePokemon = [...pokemonList];


    
    if (!pokemonList || pokemonList.length < 3) { // Need at least 3 for rotation
      console.error("Not enough Pokémon for a battle:", pokemonList?.length || 0);
      return [];
    }
    
    // Determine battle size based on battle type
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    // Create a copy of the pokemon list
// Divide into priority and non-priority pools
let priorityPool = pokemonList.filter(p => priorityPokemon.has(p.id));
let nonPriorityPool = pokemonList.filter(p => !priorityPokemon.has(p.id));

// Roll for tiered selection strategy
const rollValue = roll();
let newBattlePokemon: Pokemon[] = [];

if (rollValue < 40 && priorityPool.length >= 1 && nonPriorityPool.length >= 1) {
  // 40%: Test top 25% Pokémon vs a non-priority challenger
  const p1 = shuffleArray(priorityPool)[0];
  const p2 = shuffleArray(nonPriorityPool)[0];
  newBattlePokemon = [p1, p2];
} else if (rollValue < 70 && nonPriorityPool.length >= 1) {
  // 30%: Test two mid/lower-tier Pokémon (one may be ranked)
  const p1 = shuffleArray(nonPriorityPool)[0];
  const p2 = shuffleArray(pokemonList)[0]; // opponent can be anyone
  newBattlePokemon = [p1, p2];
} else {
  // 30%: Full random pair
  newBattlePokemon = shuffleArray(pokemonList).slice(0, battleSize);
}

// Fallback safeguard: ensure we always return a full pair
if (newBattlePokemon.length < battleSize) {
  newBattlePokemon = shuffleArray(pokemonList).slice(0, battleSize);
}

    
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
        } else {
          // Force more variety if we have too many consecutive repeats
          consecutiveRepeatsRef.current += 1;
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
    
    // Better shuffle algorithm
    const shuffled = shuffleArray(availablePokemon);
    
    
    // Double-check to ensure we don't get the exact same battle
    if (lastBattleIds.length > 0) {
      // Extract IDs from the new battle Pokemon
      const newBattleIds = newBattlePokemon.map(p => p.id).sort();
      const sortedLastIds = [...lastBattleIds].sort();
      
      // Check if the new battle contains exactly the same Pokemon (regardless of order)
      const isSameBattle = newBattleIds.length === sortedLastIds.length && 
        newBattleIds.every((id, i) => id === sortedLastIds[i]);
      
      // If we got the same battle or have too many repeats, force a different selection
      if (isSameBattle || consecutiveRepeatsRef.current > 2) {
        console.log("Still got the same Pokemon or too many repeats, forcing different selection...");
        consecutiveRepeatsRef.current += 1;
        
        // Force a completely different selection
        if (shuffled.length > battleSize * 2) {
          newBattlePokemon = shuffled.slice(battleSize, battleSize * 2);
        } else {
          // Last resort - just take a new random selection from the full list
          // but with a different random seed
          newBattlePokemon = shuffleArray(pokemonList).slice(0, battleSize);
            
          // Ensure at least one Pokemon is different from last battle
          const forceNewIndex = Math.floor(Math.random() * battleSize);
          let replacementOptions = pokemonList.filter(p => !lastBattleIds.includes(p.id));
          
          if (replacementOptions.length > 0) {
            const forcedDifferentPokemon = replacementOptions[Math.floor(Math.random() * replacementOptions.length)];
            newBattlePokemon[forceNewIndex] = forcedDifferentPokemon;
          }
        }
      } else {
        // Reset consecutive repeats counter since we got a different battle
        consecutiveRepeatsRef.current = 0;
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
    
    // Update React state with the new battle Pokémon
    setCurrentBattle(newBattlePokemon);
    
    return newBattlePokemon;
  };

  return { startNewBattle };
};
