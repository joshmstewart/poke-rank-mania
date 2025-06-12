import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

interface BattleStarterConfig {
  allPokemon: Pokemon[];
  currentRankings: RankedPokemon[];
  battleType: BattleType;
  selectedGeneration: number;
  freezeList: number[];
}

export const useBattleStarterCore = (
  allPokemon: Pokemon[],
  getCurrentRankings: () => RankedPokemon[]
) => {
  const filterPokemonByGeneration = useCallback((
    pokemonList: Pokemon[],
    generation: number
  ): Pokemon[] => {
    if (generation === 0) {
      return pokemonList;
    }
    return pokemonList.filter(pokemon => pokemon.generation === generation);
  }, []);

  const filterOutFrozenPokemon = useCallback((
    pokemonList: Pokemon[],
    freezeList: number[]
  ): Pokemon[] => {
    return pokemonList.filter(pokemon => !freezeList.includes(pokemon.id));
  }, []);

  // Optimized battle selection - much faster algorithm
  const selectBattlePokemon = useCallback((
    battleType: BattleType,
    availablePokemon: Pokemon[]
  ): Pokemon[] => {
    if (battleType === "pairs") {
      // Get recent battles for quick lookup (only last 5 for performance)
      const recentlyUsed = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
      const recentSet = new Set(recentlyUsed.slice(-5)); // Only check last 5 battles
      
      // Simple approach: try random pairs until we find one not in recent set
      let attempts = 0;
      const maxAttempts = 20; // Prevent infinite loops
      
      while (attempts < maxAttempts) {
        // Pick two random Pokemon
        const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
        const pokemon1 = shuffled[0];
        const pokemon2 = shuffled[1];
        
        if (pokemon1 && pokemon2) {
          const key = [pokemon1.id, pokemon2.id].sort((a, b) => a - b).join('-');
          
          if (!recentSet.has(key)) {
            // Found a non-recent pair
            console.log(`✅ [OPTIMIZED] Selected: ${pokemon1.name} vs ${pokemon2.name}`);
            
            // Update recent battles (keep only last 10 for memory efficiency)
            const updatedRecent = [...recentlyUsed.slice(-9), key];
            localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(updatedRecent));
            
            return [pokemon1, pokemon2];
          }
        }
        attempts++;
      }
      
      // Fallback: just pick any two Pokemon if we can't find non-recent ones
      const fallback = availablePokemon.slice(0, 2);
      console.log(`🔄 [OPTIMIZED] Fallback selection: ${fallback.map(p => p.name).join(' vs ')}`);
      return fallback;
    }
    
    if (battleType === "triplets") {
      if (availablePokemon.length < 3) {
        console.warn("Not enough Pokémon available for a triplets battle.");
        return [];
      }

      // Simple random selection for triplets
      const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      
      console.log(`✅ [OPTIMIZED] Selected triplets: ${selected.map(p => p.name).join(', ')}`);
      return selected;
    }

    return [];
  }, []);

  const startNewBattle = useCallback((
    config: BattleStarterConfig
  ): Pokemon[] => {
    const {
      allPokemon,
      battleType,
      selectedGeneration,
      freezeList
    } = config;

    // 1. Filter by generation
    const generationFilteredPokemon = filterPokemonByGeneration(allPokemon, selectedGeneration);

    // 2. Filter out frozen Pokemon
    const availablePokemon = filterOutFrozenPokemon(generationFilteredPokemon, freezeList);

    if (availablePokemon.length < (battleType === "pairs" ? 2 : 3)) {
      console.warn(`Not enough Pokemon available for ${battleType} battle`);
      return [];
    }

    // 3. Select battle Pokemon using optimized algorithm
    const battlePokemon = selectBattlePokemon(battleType, availablePokemon);

    return battlePokemon;
  }, [filterPokemonByGeneration, filterOutFrozenPokemon, selectBattlePokemon]);

  return { startNewBattle };
};
