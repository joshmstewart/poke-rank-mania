import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

export const useBattleGeneration = (allPokemon: Pokemon[]) => {
  const [recentlyUsedPokemon, setRecentlyUsedPokemon] = useState<Set<number>>(new Set());

  const generateNewBattle = useCallback((battleType: BattleType, battlesCompleted: number): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const battleNumber = battlesCompleted + 1;
    
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] ===== Battle #${battleNumber} Generation =====`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Battle size: ${battleSize}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Total Pokemon: ${allPokemon.length}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Recently used Pokemon count: ${recentlyUsedPokemon.size}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Recently used IDs: [${Array.from(recentlyUsedPokemon).join(', ')}]`);
    
    if (!allPokemon || allPokemon.length < battleSize) {
      console.error(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Not enough Pokemon: need ${battleSize}, have ${allPokemon.length}`);
      return [];
    }
    
    // Step 1: Filter out recently used Pokemon FIRST
    let availablePokemon = allPokemon.filter(pokemon => !recentlyUsedPokemon.has(pokemon.id));
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Available after filtering recent: ${availablePokemon.length}`);
    
    // Step 2: If not enough available, reduce the recent list size
    if (availablePokemon.length < battleSize) {
      console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Not enough non-recent Pokemon, reducing recent list`);
      
      // Keep only the last 10 instead of 20
      const recentArray = Array.from(recentlyUsedPokemon);
      const reducedRecent = new Set(recentArray.slice(-10));
      setRecentlyUsedPokemon(reducedRecent);
      
      availablePokemon = allPokemon.filter(pokemon => !reducedRecent.has(pokemon.id));
      console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Available after reducing recent list: ${availablePokemon.length}`);
      
      // If still not enough, clear recent list completely
      if (availablePokemon.length < battleSize) {
        console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Still not enough, clearing recent list completely`);
        setRecentlyUsedPokemon(new Set());
        availablePokemon = [...allPokemon];
      }
    }
    
    // Step 3: Use crypto random for true randomness
    const selected: Pokemon[] = [];
    const availableCopy = [...availablePokemon];
    
    // Fisher-Yates shuffle with crypto random
    for (let i = availableCopy.length - 1; i > 0; i--) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const j = Math.floor((randomArray[0] / (0xFFFFFFFF + 1)) * (i + 1));
      [availableCopy[i], availableCopy[j]] = [availableCopy[j], availableCopy[i]];
    }
    
    // Take the first battleSize Pokemon from shuffled array
    const result = availableCopy.slice(0, battleSize);
    const validated = validateBattlePokemon(result);
    
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Selected Pokemon: ${validated.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] ===== Generation Complete =====`);
    
    return validated;
  }, [allPokemon, recentlyUsedPokemon]);

  const addToRecentlyUsed = useCallback((pokemon: Pokemon[]) => {
    setRecentlyUsedPokemon(prev => {
      const newRecent = new Set(prev);
      pokemon.forEach(p => {
        newRecent.add(p.id);
        console.log(`📝 [RECENT_TRACKING] Added ${p.name}(${p.id}) to recent list`);
      });
      
      // Keep only the last 20 Pokemon
      if (newRecent.size > 20) {
        const recentArray = Array.from(newRecent);
        const toKeep = recentArray.slice(-20);
        console.log(`📝 [RECENT_TRACKING] Trimmed recent list to last 20: [${toKeep.join(', ')}]`);
        return new Set(toKeep);
      }
      
      console.log(`📝 [RECENT_TRACKING] Recent list now has ${newRecent.size} Pokemon: [${Array.from(newRecent).join(', ')}]`);
      return newRecent;
    });
  }, []);

  const resetRecentlyUsed = useCallback(() => {
    setRecentlyUsedPokemon(new Set());
  }, []);

  return {
    generateNewBattle,
    addToRecentlyUsed,
    resetRecentlyUsed
  };
};
