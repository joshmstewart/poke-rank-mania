
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

  const selectBattlePokemon = useCallback((
    battleType: BattleType,
    availablePokemon: Pokemon[],
    recentlyUsed: string[]
  ): Pokemon[] => {
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] ===== SELECTING BATTLE POKEMON =====`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Recently used entries: ${recentlyUsed.length}`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Recently used: ${recentlyUsed.join(', ')}`);
    
    if (battleType === "pairs") {
      const battleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Current battle count: ${battleCount}`);
      
      // Get all possible pairs
      const allPairs: Array<{pokemon1: Pokemon, pokemon2: Pokemon, key: string}> = [];
      for (let i = 0; i < availablePokemon.length; i++) {
        for (let j = i + 1; j < availablePokemon.length; j++) {
          const pokemon1 = availablePokemon[i];
          const pokemon2 = availablePokemon[j];
          const key = [pokemon1.id, pokemon2.id].sort((a, b) => a - b).join('-');
          allPairs.push({ pokemon1, pokemon2, key });
        }
      }
      
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Total possible pairs: ${allPairs.length}`);
      
      // CRITICAL FIX: Instead of clearing recently used when empty, implement better distribution
      let unusedPairs = allPairs.filter(pair => !recentlyUsed.includes(pair.key));
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Unused pairs: ${unusedPairs.length}`);
      
      if (unusedPairs.length === 0) {
        console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] ❌ NO UNUSED PAIRS! Implementing better distribution`);
        
        // CRITICAL FIX: Instead of clearing all, remove only the oldest 50% of entries
        const halfSize = Math.floor(recentlyUsed.length / 2);
        const remainingUsed = recentlyUsed.slice(halfSize);
        
        console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Removing ${halfSize} oldest entries, keeping ${remainingUsed.length}`);
        localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(remainingUsed));
        
        // Now get unused pairs with the reduced recently used list
        unusedPairs = allPairs.filter(pair => !remainingUsed.includes(pair.key));
        console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] After partial clear - unused pairs: ${unusedPairs.length}`);
        
        // If still no unused pairs, pick the least recently used
        if (unusedPairs.length === 0) {
          console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] Still no unused pairs - picking least recently used`);
          
          // Find pairs that were used earliest (not in the recent half)
          const oldestUsedPairs = recentlyUsed.slice(0, halfSize);
          unusedPairs = allPairs.filter(pair => oldestUsedPairs.includes(pair.key));
          
          if (unusedPairs.length === 0) {
            // Last resort: pick any pair
            unusedPairs = [allPairs[Math.floor(Math.random() * allPairs.length)]];
          }
        }
      }
      
      // Select random unused pair
      const randomIndex = Math.floor(Math.random() * unusedPairs.length);
      const selectedPair = unusedPairs[randomIndex];
      const result = [selectedPair.pokemon1, selectedPair.pokemon2];
      
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] ✅ SELECTED: ${result[0].name} vs ${result[1].name}`);
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] ✅ SELECTED IDs: ${result[0].id} vs ${result[1].id}`);
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] ✅ SELECTED key: ${selectedPair.key}`);
      console.log(`🚨🚨🚨 [BATTLE_GENERATION_DEBUG] ✅ Was this pair recently used? ${recentlyUsed.includes(selectedPair.key)}`);
      
      return result;
    }
    
    if (battleType === "triplets") {
      if (availablePokemon.length < 3) {
        console.warn("Not enough Pokémon available for a triplets battle.  Returning empty array.");
        return [];
      }

      const selected: Pokemon[] = [];
      const availableIndices = Array.from({ length: availablePokemon.length }, (_, i) => i);

      while (selected.length < 3 && availableIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const pokemonIndex = availableIndices[randomIndex];
        selected.push(availablePokemon[pokemonIndex]);
        availableIndices.splice(randomIndex, 1);
      }

      console.log(`Selected triplets: ${selected.map(p => p.name).join(', ')}`);
      return selected;
    }

    return [];
  }, []);

  const startNewBattle = useCallback((
    config: BattleStarterConfig
  ): Pokemon[] => {
    const {
      allPokemon,
      currentRankings,
      battleType,
      selectedGeneration,
      freezeList
    } = config;

    // 1. Filter by generation
    const generationFilteredPokemon = filterPokemonByGeneration(allPokemon, selectedGeneration);
    console.log(`Generation filter: ${generationFilteredPokemon.length} Pokemon of generation ${selectedGeneration}`);

    // 2. Filter out frozen Pokemon
    const availablePokemon = filterOutFrozenPokemon(generationFilteredPokemon, freezeList);
    console.log(`Freeze filter: ${availablePokemon.length} available Pokemon after removing frozen`);

    // 3. Get recently used battles
    const recentlyUsed = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
    console.log(`Recently used battles: ${recentlyUsed.length} entries`);

    // 4. Select battle Pokemon
    const battlePokemon = selectBattlePokemon(battleType, availablePokemon, recentlyUsed);
    console.log(`Selected battle: ${battlePokemon.length} Pokemon for a ${battleType} battle`);

    return battlePokemon;
  }, [filterPokemonByGeneration, filterOutFrozenPokemon, selectBattlePokemon]);

  return { startNewBattle };
};
