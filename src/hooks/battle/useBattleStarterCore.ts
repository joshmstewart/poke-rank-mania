
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
    const battleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    
    // IMMEDIATE DIAGNOSTIC: Check stored battle sequence for repetition pattern
    const storedSequence = JSON.parse(localStorage.getItem('pokemon-battle-sequence') || '[]');
    console.log(`🔍 [REPETITION_DIAGNOSTIC] Battle #${battleCount + 1} - Stored sequence:`, storedSequence);
    
    if (storedSequence.length >= 10) {
      const battle10 = storedSequence.find(b => b.battleNumber === 10);
      const battle11 = storedSequence.find(b => b.battleNumber === 11);
      const battle12 = storedSequence.find(b => b.battleNumber === 12);
      const battle13 = storedSequence.find(b => b.battleNumber === 13);
      const battle14 = storedSequence.find(b => b.battleNumber === 14);
      
      console.log(`🚨 [REPETITION_DIAGNOSTIC] Battle 10: ${battle10?.pokemonNames} (${battle10?.battleKey})`);
      console.log(`🚨 [REPETITION_DIAGNOSTIC] Battle 11: ${battle11?.pokemonNames} (${battle11?.battleKey})`);
      console.log(`🚨 [REPETITION_DIAGNOSTIC] Battle 12: ${battle12?.pokemonNames} (${battle12?.battleKey})`);
      console.log(`🚨 [REPETITION_DIAGNOSTIC] Battle 13: ${battle13?.pokemonNames} (${battle13?.battleKey})`);
      console.log(`🚨 [REPETITION_DIAGNOSTIC] Battle 14: ${battle14?.pokemonNames} (${battle14?.battleKey})`);
      
      // Check for exact repetition
      if (battle11 && battle12 && battle11.battleKey === battle12.battleKey) {
        console.log(`🚨🚨🚨 [REPETITION_FOUND] Battle 11 and 12 are IDENTICAL: ${battle11.battleKey}`);
      }
      if (battle12 && battle13 && battle12.battleKey === battle13.battleKey) {
        console.log(`🚨🚨🚨 [REPETITION_FOUND] Battle 12 and 13 are IDENTICAL: ${battle12.battleKey}`);
      }
      if (battle13 && battle14 && battle13.battleKey === battle14.battleKey) {
        console.log(`🚨🚨🚨 [REPETITION_FOUND] Battle 13 and 14 are IDENTICAL: ${battle13.battleKey}`);
      }
    }
    
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] ===== BATTLE #${battleCount + 1} GENERATION =====`);
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Battle type: ${battleType}`);
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Recently used entries: ${recentlyUsed.length}`);
    
    if (battleType === "pairs") {
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
      
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Total possible pairs: ${allPairs.length}`);
      
      // CRITICAL FIX: Filter out the last 5 battles from recently used to prevent immediate repetition
      const lastFiveBattles = recentlyUsed.slice(-5);
      let unusedPairs = allPairs.filter(pair => !lastFiveBattles.includes(pair.key));
      console.log(`🔧 [REPETITION_FIX] Excluding last 5 battles: [${lastFiveBattles.join(', ')}]`);
      console.log(`🔧 [REPETITION_FIX] Pairs after excluding last 5: ${unusedPairs.length}`);
      
      if (unusedPairs.length === 0) {
        console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] ❌ NO UNUSED PAIRS after excluding last 5! Using last 10 exclusion`);
        
        // Exclude last 10 battles instead
        const lastTenBattles = recentlyUsed.slice(-10);
        unusedPairs = allPairs.filter(pair => !lastTenBattles.includes(pair.key));
        console.log(`🔧 [REPETITION_FIX] Excluding last 10 battles: [${lastTenBattles.join(', ')}]`);
        console.log(`🔧 [REPETITION_FIX] Pairs after excluding last 10: ${unusedPairs.length}`);
        
        if (unusedPairs.length === 0) {
          console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Still no unused pairs - clearing half of recently used`);
          
          const halfSize = Math.floor(recentlyUsed.length / 2);
          const remainingUsed = recentlyUsed.slice(halfSize);
          localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(remainingUsed));
          
          unusedPairs = allPairs.filter(pair => !remainingUsed.includes(pair.key));
          console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] After partial clear - unused pairs: ${unusedPairs.length}`);
          
          if (unusedPairs.length === 0) {
            // Last resort: pick random pair
            unusedPairs = [allPairs[Math.floor(Math.random() * allPairs.length)]];
            console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Last resort - random pair selected`);
          }
        }
      }
      
      // Select random unused pair
      const randomIndex = Math.floor(Math.random() * unusedPairs.length);
      const selectedPair = unusedPairs[randomIndex];
      const result = [selectedPair.pokemon1, selectedPair.pokemon2];
      
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] ===== BATTLE #${battleCount + 1} SELECTED =====`);
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Selected: ${result[0].name} (${result[0].id}) vs ${result[1].name} (${result[1].id})`);
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Selected key: ${selectedPair.key}`);
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Was this pair in last 5 battles? ${lastFiveBattles.includes(selectedPair.key)}`);
      
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

      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Selected triplets: ${selected.map(p => p.name).join(', ')}`);
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
