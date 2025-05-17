
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
    const battleSize = battleType === "pairs" ? 2 : 3;
    if (!allPokemonForGeneration || allPokemonForGeneration.length < battleSize) {
      console.error("Not enough Pokemon for a battle");
      setCurrentBattle([]);
      return [];
    }

    // Ensure we have arrays to work with
    const ranked = Array.isArray(currentFinalRankings) ? [...currentFinalRankings] : [];
    const unranked = Array.isArray(allPokemonForGeneration) 
      ? allPokemonForGeneration.filter(p => !ranked.some(r => r.id === p.id))
      : [];
    
    console.log(`Starting battle with ${ranked.length} ranked and ${unranked.length} unranked Pokémon`);
    
    let result: Pokemon[] = [];
    
    // EARLY GAME STRATEGY - If we have fewer than 50 ranked Pokemon, focus on introducing new Pokemon
    if (ranked.length < 50) {
      console.log("Early game strategy: Introducing new Pokémon");
      
      // If we have unranked Pokemon, strongly prefer using them
      if (unranked.length >= 2) {
        // 90% chance to use only unranked
        if (roll() < 90) {
          result = pickFreshPokemonPair(unranked);
          console.log("Using fresh unranked pair");
        } 
        // 10% chance to mix ranked and unranked
        else if (ranked.length > 0) {
          result = pickPokemonFromPools(ranked, unranked);
          console.log("Mixing ranked and unranked");
        } else {
          result = pickFreshPokemonPair(unranked);
        }
      }
      // If we don't have enough unranked, mix ranked and any remaining unranked
      else if (unranked.length === 1 && ranked.length >= 1) {
        result = [unranked[0]];
        
        // Find a ranked Pokemon that hasn't battled this unranked one
        for (let i = 0; i < ranked.length; i++) {
          if (!hasPairBattled(unranked[0].id, ranked[i].id)) {
            result.push(ranked[i]);
            recordBattledPair(unranked[0].id, ranked[i].id);
            break;
          }
        }
        
        // If we couldn't find one, just pick any ranked Pokemon
        if (result.length < 2) {
          const rankedPokemon = ranked[Math.floor(Math.random() * ranked.length)];
          result.push(rankedPokemon);
          recordBattledPair(unranked[0].id, rankedPokemon.id);
        }
      }
      // Use only ranked Pokemon if we have no choice
      else {
        result = pickFreshPokemonPair(ranked);
      }
    } 
    // MID/LATE GAME STRATEGY - Use the tier-based approach
    else {
      console.log("Mid/late game strategy: Using tier-based approach");
      
      const getSliceByCount = (list: Pokemon[], count: number) =>
        list.slice(0, Math.min(count, list.length));
      const getSliceByPercent = (list: Pokemon[], percent: number) =>
        list.slice(0, Math.floor((percent / 100) * list.length));

      // Define our Pokemon pools
      const T_Top10 = getSliceByPercent(ranked, 10);
      const T_Top20 = getSliceByCount(ranked, 20);
      const T_Top25 = getSliceByPercent(ranked, 25);
      const T_Top50 = getSliceByPercent(ranked, 50);
      const T_Bottom50 = ranked.filter(p => !T_Top50.includes(p));

      // Try different selection strategies based on a random roll
      const r = roll();
      if (r < 15 && T_Top10.length >= 1 && T_Top20.length >= 1) 
        result = pickPokemonFromPools(T_Top10, T_Top20);
      else if (r < 30 && T_Top10.length >= 1 && T_Top25.length >= 1) 
        result = pickPokemonFromPools(T_Top10, T_Top25);
      else if (r < 50 && T_Top25.length >= 1 && T_Top50.length >= 1) 
        result = pickPokemonFromPools(T_Top25, T_Top50);
      else if (r < 70 && T_Top50.length >= 1 && T_Bottom50.length >= 1) 
        result = pickPokemonFromPools(T_Top50, T_Bottom50);
      else if (unranked.length >= 1 && T_Top50.length >= 1) 
        result = pickPokemonFromPools(unranked, T_Top50);
      else if (unranked.length >= 2) 
        result = pickPokemonFromPools(unranked, unranked);
      
      // Mix in occasional completely unranked battles
      if (result.length < battleSize && unranked.length >= 2 && roll() < 20) {
        result = pickFreshPokemonPair(unranked);
      }
    }
    
    // If we still didn't get enough Pokemon, just pick randomly from all
    if (result.length < battleSize) {
      // Make sure we don't use Pokemon from the last battle
      const availablePokemon = allPokemonForGeneration.filter(p => 
        !lastBattle.includes(p.id) && !recentlySeenPokemon.has(p.id)
      );
      
      // If we've filtered too much, just use all Pokemon
      const sourcePool = availablePokemon.length >= battleSize ? 
        availablePokemon : allPokemonForGeneration;
        
      result = shuffleArray(sourcePool).slice(0, battleSize);
      
      // Record this pair as battled
      if (result.length >= 2) {
        recordBattledPair(result[0].id, result[1].id);
      }
    }

    // Safety check - make sure we have enough Pokemon
    if (result.length < battleSize) {
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
      
      // Record this pair as battled
      if (result.length >= 2) {
        recordBattledPair(result[0].id, result[1].id);
      }
    }

    // Check if the new battle is the same as the last battle
    const newIds = result.map(p => p.id).sort();
    const lastIds = [...lastBattle].sort();
    const isSame = newIds.length === lastIds.length && 
      newIds.every((id, i) => id === lastIds[i]);

    // If we got the same battle or had too many repeats, force a new battle
    if (isSame || consecutiveRepeats > 2) {
      console.log("Detected repeated battle, forcing new selection");
      // Force a completely different selection by excluding recent Pokemon
      const freshPool = allPokemonForGeneration.filter(p => 
        !recentlySeenPokemon.has(p.id)
      );
      
      if (freshPool.length >= battleSize) {
        result = shuffleArray(freshPool).slice(0, battleSize);
      } else {
        // If we don't have enough fresh Pokemon, use all but shuffle well
        result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
      }
      
      // Record this pair as battled
      if (result.length >= 2) {
        recordBattledPair(result[0].id, result[1].id);
      }
      
      consecutiveRepeats++;
    } else {
      consecutiveRepeats = 0;
    }

    // Update our tracking variables
    previousBattles = [...previousBattles, newIds].slice(-10);
    lastBattle = newIds;
    
    // Add the new Pokemon to recently seen
    newIds.forEach(id => {
      recentlySeenPokemon.add(id);
      
      // Keep the recently seen list from growing too large
      if (recentlySeenPokemon.size > Math.min(20, allPokemonForGeneration.length / 2)) {
        recentlySeenPokemon.delete([...recentlySeenPokemon][0]);
      }
    });

    console.log("Starting new battle with:", result.map(p => p.name).join(", "));
    setCurrentBattle(result);
    return result;
  };

  return { startNewBattle };
};
