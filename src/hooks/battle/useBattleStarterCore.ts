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
    
    // IMMEDIATE ANALYSIS: Extract and display the exact stored battle sequence
    const storedSequence = JSON.parse(localStorage.getItem('pokemon-battle-sequence') || '[]');
    console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] ===== COMPLETE BATTLE SEQUENCE ANALYSIS =====`);
    console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] Total battles in sequence: ${storedSequence.length}`);
    console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] Current battle count: ${battleCount + 1}`);
    
    // Display ALL battles with their numbers and keys
    storedSequence.forEach((battle, index) => {
      console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] Battle #${battle.battleNumber}: ${battle.pokemonNames} (Key: ${battle.battleKey})`);
    });
    
    // Check for ANY duplicates in the sequence
    const battleKeys = storedSequence.map(b => b.battleKey);
    const duplicates = [];
    for (let i = 0; i < battleKeys.length; i++) {
      for (let j = i + 1; j < battleKeys.length; j++) {
        if (battleKeys[i] === battleKeys[j]) {
          duplicates.push({
            key: battleKeys[i],
            battle1: storedSequence[i].battleNumber,
            battle2: storedSequence[j].battleNumber,
            names: storedSequence[i].pokemonNames
          });
        }
      }
    }
    
    if (duplicates.length > 0) {
      console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] ===== DUPLICATES FOUND =====`);
      duplicates.forEach(dup => {
        console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] DUPLICATE: Battle #${dup.battle1} and #${dup.battle2} both used "${dup.names}" (Key: ${dup.key})`);
      });
    } else {
      console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] No duplicates found in stored sequence`);
    }
    
    // Specifically check battles 10-14
    const criticalBattles = storedSequence.filter(b => b.battleNumber >= 10 && b.battleNumber <= 14);
    console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] ===== BATTLES 10-14 ANALYSIS =====`);
    criticalBattles.forEach(battle => {
      console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] Battle #${battle.battleNumber}: ${battle.pokemonNames} (Key: ${battle.battleKey})`);
    });
    
    // Check for consecutive duplicates in 10-14 range
    for (let i = 0; i < criticalBattles.length - 1; i++) {
      const current = criticalBattles[i];
      const next = criticalBattles[i + 1];
      if (current.battleKey === next.battleKey) {
        console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] CONSECUTIVE DUPLICATE FOUND: Battle #${current.battleNumber} and #${next.battleNumber} are identical!`);
        console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] Repeated pair: ${current.pokemonNames} (Key: ${current.battleKey})`);
      }
    }
    
    console.log(`🚨🚨🚨 [SEQUENCE_ANALYSIS] ===== END SEQUENCE ANALYSIS =====`);
    
    
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
