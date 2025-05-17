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

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const roll = () => Math.random() * 100;

  const pickPokemonFromPools = (pool1: Pokemon[], pool2: Pokemon[]) => {
    if (!pool1.length || !pool2.length) return [];
    
    // Check if pools are the same to avoid picking the same Pokemon twice
    const isSamePool = pool1 === pool2;
    const used = new Set<number>();
    const result: Pokemon[] = [];

    // Pick one Pokemon from pool1
    const p1Index = Math.floor(Math.random() * pool1.length);
    const p1 = pool1[p1Index];
    if (p1) {
      result.push(p1);
      used.add(p1.id);
    }

    // Try to pick a second Pokemon from pool2 that isn't the same as p1
    let attempts = 0;
    const maxAttempts = isSamePool ? 20 : 10; // More attempts if same pool to ensure diversity
    
    while (result.length < 2 && attempts < maxAttempts) {
      // If we're selecting from the same pool and it's small, we need to be careful
      const p2Index = Math.floor(Math.random() * pool2.length);
      const p2 = pool2[p2Index];
      
      if (p2 && !used.has(p2.id) && !recentlySeenPokemon.has(p2.id)) {
        result.push(p2);
        break;
      }
      attempts++;
      
      // If we've tried too many times, relax the "recently seen" constraint
      if (attempts > maxAttempts / 2 && p2 && !used.has(p2.id)) {
        result.push(p2);
        break;
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

    let result: Pokemon[] = [];

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
    
    // If we didn't get enough Pokemon, just pick randomly from all
    if (result.length < battleSize) {
      // Make sure we don't use Pokemon from the last battle
      const availablePokemon = allPokemonForGeneration.filter(p => 
        !lastBattle.includes(p.id) && !recentlySeenPokemon.has(p.id)
      );
      
      // If we've filtered too much, just use all Pokemon
      const sourcePool = availablePokemon.length >= battleSize ? 
        availablePokemon : allPokemonForGeneration;
        
      result = shuffleArray(sourcePool).slice(0, battleSize);
    }

    // Safety check - make sure we have enough Pokemon
    if (result.length < battleSize) {
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
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
