
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: Pokemon[],
  setCurrentBattle: (battle: Pokemon[]) => void
) => {
  // Use plain objects instead of hooks
  let previousBattles: number[][] = [];
  let lastBattle: number[] = [];
  let recentlySeenPokemon: Set<number> = new Set();
  let consecutiveRepeats = 0;
  
  // Store pairs that have already battled to avoid repeats
  let battledPairs: Set<string> = new Set();

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const roll = () => Math.random() * 100;

  // Check if a pair has already battled
  const hasPairBattled = (id1: number, id2: number): boolean => {
    const pairKey = [id1, id2].sort().join('-');
    return battledPairs.has(pairKey);
  };
  
  // Record a pair as battled
  const recordBattledPair = (id1: number, id2: number): void => {
    const pairKey = [id1, id2].sort().join('-');
    battledPairs.add(pairKey);
    
    // Limit the size of battledPairs to prevent memory issues
    if (battledPairs.size > 10000) {
      // Remove oldest entries (not exactly FIFO but good enough)
      const entries = Array.from(battledPairs);
      battledPairs = new Set(entries.slice(entries.length / 2));
    }
  };

  // Pick Pokemon that haven't been seen recently, with strong preference for Pokemon that haven't battled yet
  const pickFreshPokemonPair = (pokemonPool: Pokemon[]): Pokemon[] => {
    if (!pokemonPool.length || pokemonPool.length < 2) return [];
    
    const result: Pokemon[] = [];
    const used = new Set<number>();
    
    // Prioritize Pokemon that haven't been seen recently
    const unseenPokemon = pokemonPool.filter(p => !recentlySeenPokemon.has(p.id));
    const pool = unseenPokemon.length >= 2 ? unseenPokemon : pokemonPool;
    
    // Shuffle the pool for randomness
    const shuffledPool = shuffleArray(pool);
    
    // Try to find a completely fresh pair (not seen and not battled together)
    for (let i = 0; i < shuffledPool.length; i++) {
      const p1 = shuffledPool[i];
      if (used.has(p1.id)) continue;
      
      for (let j = 0; j < shuffledPool.length; j++) {
        if (i === j) continue;
        
        const p2 = shuffledPool[j];
        if (used.has(p2.id)) continue;
        
        // Check if this pair has battled before
        if (hasPairBattled(p1.id, p2.id)) continue;
        
        // Found a fresh pair!
        result.push(p1, p2);
        used.add(p1.id);
        used.add(p2.id);
        recordBattledPair(p1.id, p2.id);
        return result;
      }
    }
    
    // If we couldn't find a completely fresh pair, try again with just unseen Pokemon
    if (result.length < 2) {
      const p1 = shuffledPool[0];
      if (p1) {
        result.push(p1);
        used.add(p1.id);
        
        for (let i = 1; i < shuffledPool.length; i++) {
          const p2 = shuffledPool[i];
          if (!used.has(p2.id)) {
            result.push(p2);
            recordBattledPair(p1.id, p2.id);
            break;
          }
        }
      }
    }
    
    // If we still couldn't find a pair, just pick randomly
    if (result.length < 2) {
      const randomPair = shuffleArray(pokemonPool).slice(0, 2);
      if (randomPair.length === 2) {
        recordBattledPair(randomPair[0].id, randomPair[1].id);
        return randomPair;
      }
    }
    
    return result;
  };

  const pickPokemonFromPools = (pool1: Pokemon[], pool2: Pokemon[]) => {
    if (!pool1.length || !pool2.length) return [];
    
    // Check if pools are the same to avoid picking the same Pokemon twice
    const isSamePool = pool1 === pool2;
    const used = new Set<number>();
    const result: Pokemon[] = [];

    // Try to find pairs that haven't battled yet
    for (let attempts = 0; attempts < 15; attempts++) {
      // Pick one Pokemon from pool1
      const p1Index = Math.floor(Math.random() * pool1.length);
      const p1 = pool1[p1Index];
      
      if (!p1) continue;
      
      // Try to find a Pokemon from pool2 that hasn't battled with p1
      let foundValidP2 = false;
      
      for (let p2attempts = 0; p2attempts < 10; p2attempts++) {
        const p2Index = Math.floor(Math.random() * pool2.length);
        const p2 = pool2[p2Index];
        
        if (!p2 || p1.id === p2.id) continue;
        
        // Check if this pair has battled before
        if (hasPairBattled(p1.id, p2.id)) continue;
        
        // Found a valid pair!
        result.push(p1, p2);
        recordBattledPair(p1.id, p2.id);
        foundValidP2 = true;
        break;
      }
      
      if (foundValidP2) break;
    }
    
    // If we couldn't find a non-battled pair, fall back to the original logic
    if (result.length < 2) {
      // Pick one Pokemon from pool1
      const p1 = pool1[Math.floor(Math.random() * pool1.length)];
      if (p1) {
        result.push(p1);
        used.add(p1.id);
      }
      
      // Try to pick a second Pokemon from pool2 that isn't the same as p1
      let attempts = 0;
      const maxAttempts = isSamePool ? 20 : 10;
      
      while (result.length < 2 && attempts < maxAttempts) {
        const p2Index = Math.floor(Math.random() * pool2.length);
        const p2 = pool2[p2Index];
        
        if (p2 && !used.has(p2.id) && !recentlySeenPokemon.has(p2.id)) {
          result.push(p2);
          if (result.length === 2) recordBattledPair(result[0].id, result[1].id);
          break;
        }
        attempts++;
        
        // If we've tried too many times, relax the constraints
        if (attempts > maxAttempts / 2 && p2 && !used.has(p2.id)) {
          result.push(p2);
          if (result.length === 2) recordBattledPair(result[0].id, result[1].id);
          break;
        }
      }
    }

    return result;
  };

  const startNewBattle = (battleType: BattleType) => {
    console.log("createBattleStarter: Starting new battle with type:", battleType);
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    // Ensure we have proper Pokemon lists to work with
    const safeAllPokemon = Array.isArray(allPokemonForGeneration) ? allPokemonForGeneration : [];
    
    if (safeAllPokemon.length < battleSize) {
      console.error("createBattleStarter: Not enough Pokemon for a battle, only have", safeAllPokemon.length);
      return [];
    }

    // Ensure we have arrays to work with
    const ranked = Array.isArray(currentFinalRankings) ? [...currentFinalRankings] : [];
    const unranked = safeAllPokemon.filter(p => !ranked.some(r => r.id === p.id));
    
    console.log(`createBattleStarter: Starting battle with ${ranked.length} ranked and ${unranked.length} unranked Pokémon`);
    
    // Simple fallback if we have no strategy
    let result: Pokemon[] = [];
    
    // In the worst case, just pick random Pokemon
    if (safeAllPokemon.length >= battleSize) {
      result = shuffleArray([...safeAllPokemon]).slice(0, battleSize);
      console.log("createBattleStarter: Using fallback random selection with", result.map(p => p.name).join(", "));
    }
    
    // Get the final Pokemon for the battle
    const finalResult = result.length >= battleSize ? result : shuffleArray([...safeAllPokemon]).slice(0, battleSize);
    
    // Set the current battle
    if (finalResult.length >= battleSize) {
      console.log("createBattleStarter: Setting battle with", finalResult.map(p => p.name).join(", "));
      setCurrentBattle(finalResult);
      return finalResult;
    } else {
      console.error("createBattleStarter: Failed to create a battle");
      return [];
    }
  };

  return { startNewBattle };
};
