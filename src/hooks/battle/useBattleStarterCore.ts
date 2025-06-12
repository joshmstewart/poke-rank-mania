
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

  // Enhanced battle selection that can handle starred Pokemon
  const selectBattlePokemon = useCallback((
    battleType: BattleType,
    availablePokemon: Pokemon[],
    starredPokemonId?: number
  ): Pokemon[] => {
    console.log(`🎯 [BATTLE_CORE] selectBattlePokemon called with starred: ${starredPokemonId}`);
    
    if (battleType === "pairs") {
      // If we have a starred Pokemon, use it as primary
      if (starredPokemonId) {
        const starredPokemon = availablePokemon.find(p => p.id === starredPokemonId);
        if (starredPokemon) {
          // Find a random opponent (not the starred Pokemon)
          const otherPokemon = availablePokemon.filter(p => p.id !== starredPokemonId);
          if (otherPokemon.length > 0) {
            const randomOpponent = otherPokemon[Math.floor(Math.random() * otherPokemon.length)];
            console.log(`🎯 [BATTLE_CORE] Created starred battle: ${starredPokemon.name} vs ${randomOpponent.name}`);
            return [starredPokemon, randomOpponent];
          }
        }
      }
      
      // Regular random battle logic
      const recentlyUsed = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
      const recentSet = new Set(recentlyUsed.slice(-5));
      
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
        const pokemon1 = shuffled[0];
        const pokemon2 = shuffled[1];
        
        if (pokemon1 && pokemon2) {
          const key = [pokemon1.id, pokemon2.id].sort((a, b) => a - b).join('-');
          
          if (!recentSet.has(key)) {
            console.log(`🎯 [BATTLE_CORE] Selected regular battle: ${pokemon1.name} vs ${pokemon2.name}`);
            
            const updatedRecent = [...recentlyUsed.slice(-9), key];
            localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(updatedRecent));
            
            return [pokemon1, pokemon2];
          }
        }
        attempts++;
      }
      
      const fallback = availablePokemon.slice(0, 2);
      console.log(`🎯 [BATTLE_CORE] Fallback selection: ${fallback.map(p => p.name).join(' vs ')}`);
      return fallback;
    }
    
    if (battleType === "triplets") {
      if (availablePokemon.length < 3) {
        console.warn("Not enough Pokémon available for a triplets battle.");
        return [];
      }

      const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      
      console.log(`🎯 [BATTLE_CORE] Selected triplets: ${selected.map(p => p.name).join(', ')}`);
      return selected;
    }

    return [];
  }, []);

  const startNewBattle = useCallback((
    config: BattleStarterConfig,
    starredPokemonId?: number
  ): Pokemon[] => {
    const {
      allPokemon,
      battleType,
      selectedGeneration,
      freezeList
    } = config;

    console.log(`🎯 [BATTLE_CORE] startNewBattle called with starred Pokemon: ${starredPokemonId}`);

    // 1. Filter by generation
    const generationFilteredPokemon = filterPokemonByGeneration(allPokemon, selectedGeneration);

    // 2. Filter out frozen Pokemon
    const availablePokemon = filterOutFrozenPokemon(generationFilteredPokemon, freezeList);

    if (availablePokemon.length < (battleType === "pairs" ? 2 : 3)) {
      console.warn(`Not enough Pokemon available for ${battleType} battle`);
      return [];
    }

    // 3. Select battle Pokemon, potentially using starred Pokemon
    const battlePokemon = selectBattlePokemon(battleType, availablePokemon, starredPokemonId);

    return battlePokemon;
  }, [filterPokemonByGeneration, filterOutFrozenPokemon, selectBattlePokemon]);

  return { startNewBattle };
};
