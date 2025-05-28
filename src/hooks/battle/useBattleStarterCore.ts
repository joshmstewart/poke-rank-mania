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
    
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] ===== BATTLE #${battleCount + 1} GENERATION =====`);
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Battle type: ${battleType}`);
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Recently used entries: ${recentlyUsed.length}`);
    
    // CRITICAL: Log the FULL recently used list for debugging
    console.log(`🎯🎯🎯 [FULL_RECENTLY_USED_LIST] Battle #${battleCount + 1} Recently used: [${recentlyUsed.join(', ')}]`);
    
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
      
      // Filter unused pairs
      let unusedPairs = allPairs.filter(pair => !recentlyUsed.includes(pair.key));
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Unused pairs: ${unusedPairs.length}`);
      
      // CRITICAL: Log first few unused pairs for pattern analysis
      console.log(`🎯🎯🎯 [UNUSED_PAIRS_DEBUG] First 10 unused pairs:`, 
        unusedPairs.slice(0, 10).map(p => `${p.pokemon1.name}(${p.pokemon1.id}) vs ${p.pokemon2.name}(${p.pokemon2.id}) = ${p.key}`));
      
      // CRITICAL: Log recently used pairs for pattern analysis
      const recentPairDetails = recentlyUsed.slice(-10).map(key => {
        const [id1, id2] = key.split('-').map(Number);
        const p1 = availablePokemon.find(p => p.id === id1);
        const p2 = availablePokemon.find(p => p.id === id2);
        return `${p1?.name || id1}(${id1}) vs ${p2?.name || id2}(${id2}) = ${key}`;
      });
      console.log(`🎯🎯🎯 [RECENT_PAIRS_DEBUG] Last 10 recently used pairs:`, recentPairDetails);
      
      if (unusedPairs.length === 0) {
        console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] ❌ NO UNUSED PAIRS! Implementing better distribution`);
        
        // Remove only the oldest 50% of entries
        const halfSize = Math.floor(recentlyUsed.length / 2);
        const remainingUsed = recentlyUsed.slice(halfSize);
        
        console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Removing ${halfSize} oldest entries, keeping ${remainingUsed.length}`);
        console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Removed entries: [${recentlyUsed.slice(0, halfSize).join(', ')}]`);
        console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Keeping entries: [${remainingUsed.join(', ')}]`);
        
        localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(remainingUsed));
        
        // Now get unused pairs with the reduced recently used list
        unusedPairs = allPairs.filter(pair => !remainingUsed.includes(pair.key));
        console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] After partial clear - unused pairs: ${unusedPairs.length}`);
        
        // If still no unused pairs, pick the least recently used
        if (unusedPairs.length === 0) {
          console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Still no unused pairs - picking least recently used`);
          
          // Find pairs that were used earliest (not in the recent half)
          const oldestUsedPairs = recentlyUsed.slice(0, halfSize);
          unusedPairs = allPairs.filter(pair => oldestUsedPairs.includes(pair.key));
          
          if (unusedPairs.length === 0) {
            // Last resort: pick any pair
            unusedPairs = [allPairs[Math.floor(Math.random() * allPairs.length)]];
            console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Last resort - picking random pair`);
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
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Was this pair recently used? ${recentlyUsed.includes(selectedPair.key)}`);
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] Random index chosen: ${randomIndex} of ${unusedPairs.length} unused pairs`);
      
      // CRITICAL: Check if this battle is an immediate repeat of the last battle
      const lastBattleKey = recentlyUsed[recentlyUsed.length - 1];
      if (lastBattleKey === selectedPair.key) {
        console.log(`🚨🚨🚨 [IMMEDIATE_REPEAT_DETECTED] BATTLE #${battleCount + 1} IS IMMEDIATE REPEAT OF LAST BATTLE!`);
        console.log(`🚨🚨🚨 [IMMEDIATE_REPEAT_DETECTED] Last battle key: ${lastBattleKey}`);
        console.log(`🚨🚨🚨 [IMMEDIATE_REPEAT_DETECTED] Selected key: ${selectedPair.key}`);
        console.log(`🚨🚨🚨 [IMMEDIATE_REPEAT_DETECTED] This should NOT happen! Bug in recently used logic!`);
      }
      
      console.log(`🎯🎯🎯 [BATTLE_SEQUENCE_TRACKER] ===== END BATTLE #${battleCount + 1} GENERATION =====`);
      
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
