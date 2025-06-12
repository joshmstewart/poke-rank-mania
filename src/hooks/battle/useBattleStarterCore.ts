
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

  // CRITICAL FIX: Enhanced battle selection that GUARANTEES starred Pokemon are used
  const selectBattlePokemon = useCallback((
    battleType: BattleType,
    availablePokemon: Pokemon[],
    starredPokemonId?: number
  ): Pokemon[] => {
    console.log(`🎯 [BATTLE_CORE] selectBattlePokemon called with starred: ${starredPokemonId}`);
    
    if (battleType === "pairs") {
      // CRITICAL FIX: If we have a starred Pokemon, find it in ALL Pokemon (not just available)
      if (starredPokemonId) {
        const starredPokemon = allPokemon.find(p => p.id === starredPokemonId);
        console.log(`🎯 [BATTLE_CORE] Looking for starred Pokemon ${starredPokemonId} in all Pokemon:`, !!starredPokemon);
        
        if (starredPokemon) {
          // Find a random opponent from available Pokemon (excluding the starred one)
          const otherPokemon = availablePokemon.filter(p => p.id !== starredPokemonId);
          console.log(`🎯 [BATTLE_CORE] Available opponents: ${otherPokemon.length}`);
          
          if (otherPokemon.length > 0) {
            const randomOpponent = otherPokemon[Math.floor(Math.random() * otherPokemon.length)];
            console.log(`🎯 [BATTLE_CORE] ✅ Created starred battle: ${starredPokemon.name} vs ${randomOpponent.name}`);
            return [starredPokemon, randomOpponent];
          } else {
            // If no other Pokemon available, use any Pokemon from all Pokemon
            const allOtherPokemon = allPokemon.filter(p => p.id !== starredPokemonId);
            if (allOtherPokemon.length > 0) {
              const randomOpponent = allOtherPokemon[Math.floor(Math.random() * allOtherPokemon.length)];
              console.log(`🎯 [BATTLE_CORE] ✅ Created starred battle with any opponent: ${starredPokemon.name} vs ${randomOpponent.name}`);
              return [starredPokemon, randomOpponent];
            }
          }
        } else {
          console.error(`🎯 [BATTLE_CORE] ❌ Starred Pokemon ${starredPokemonId} not found in allPokemon!`);
        }
      }
      
      // Regular random battle logic when no starred Pokemon or starred Pokemon failed
      console.log(`🎯 [BATTLE_CORE] Using regular battle logic with ${availablePokemon.length} available Pokemon`);
      
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
  }, [allPokemon]);

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

    // 1. Filter by generation (but we'll handle starred Pokemon separately)
    const generationFilteredPokemon = filterPokemonByGeneration(allPokemon, selectedGeneration);

    // 2. Filter out frozen Pokemon
    const availablePokemon = filterOutFrozenPokemon(generationFilteredPokemon, freezeList);

    console.log(`🎯 [BATTLE_CORE] Available Pokemon after filtering: ${availablePokemon.length}`);

    if (availablePokemon.length < (battleType === "pairs" ? 2 : 3) && !starredPokemonId) {
      console.warn(`Not enough Pokemon available for ${battleType} battle`);
      return [];
    }

    // 3. Select battle Pokemon, with special handling for starred Pokemon
    const battlePokemon = selectBattlePokemon(battleType, availablePokemon, starredPokemonId);

    console.log(`🎯 [BATTLE_CORE] Final battle Pokemon: ${battlePokemon.map(p => p.name).join(' vs ')}`);
    return battlePokemon;
  }, [filterPokemonByGeneration, filterOutFrozenPokemon, selectBattlePokemon]);

  return { startNewBattle };
};
