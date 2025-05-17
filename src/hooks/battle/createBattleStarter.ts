
import { useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  // Use refs instead of state to track battle history
  const previousBattlesRef = useRef<Set<string>>(new Set());
  const recentlySeenPokemon = useRef<Set<number>>(new Set());
  const lastBattleRef = useRef<number[]>([]);
  const consecutiveRepeatsRef = useRef(0);

  // Helper function to shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Roll a random number between 0 and 100
  const roll = () => Math.random() * 100;

  // Helper to create a unique battle ID for tracking
  const getBattleId = (pokemonIds: number[]): string => {
    return [...pokemonIds].sort().join("-");
  };

  // Generate non-repeating pokemon selections
  const getUniqueRandomPokemon = (pool: Pokemon[], count: number, excludeIds: Set<number> = new Set()): Pokemon[] => {
    // If we don't have enough unique Pokemon left, use what we have
    const availablePokemon = pool.filter(p => !excludeIds.has(p.id));
    if (availablePokemon.length < count) {
      console.log("Not enough unique Pokemon available, using what we have");
      return shuffleArray(availablePokemon);
    }
    
    // Get random unique Pokemon
    const selected: Pokemon[] = [];
    const tempPool = [...availablePokemon];
    
    while (selected.length < count && tempPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * tempPool.length);
      const pokemon = tempPool[randomIndex];
      
      // Remove from temp pool to avoid duplicates
      tempPool.splice(randomIndex, 1);
      selected.push(pokemon);
    }
    
    return selected;
  };

  // Pick pokemon from two different pools, ensuring they are unique
  const pickPokemonFromPools = (pool1: Pokemon[], pool2: Pokemon[], battleSize: number): Pokemon[] => {
    if (!pool1.length || !pool2.length) return [];
    
    // Start with empty selection
    const result: Pokemon[] = [];
    const usedIds = new Set<number>();
    
    // Filter recently seen Pokemon from each pool when possible
    const filteredPool1 = pool1.filter(p => !recentlySeenPokemon.current.has(p.id));
    const filteredPool2 = pool2.filter(p => !recentlySeenPokemon.current.has(p.id));
    
    // Use filtered pools if they're not empty
    const usePool1 = filteredPool1.length > 0 ? filteredPool1 : pool1;
    const usePool2 = filteredPool2.length > 0 ? filteredPool2 : pool2;
    
    // How many to pick from each pool
    const pool1Count = Math.min(Math.ceil(battleSize / 2), usePool1.length);
    const pool2Count = battleSize - pool1Count;

    // Get pokemon from pool 1
    if (pool1Count > 0) {
      const selected = getUniqueRandomPokemon(usePool1, pool1Count, usedIds);
      for (const pokemon of selected) {
        result.push(pokemon);
        usedIds.add(pokemon.id);
      }
    }
    
    // Get remaining pokemon from pool 2
    if (pool2Count > 0) {
      const selected = getUniqueRandomPokemon(usePool2, pool2Count, usedIds);
      for (const pokemon of selected) {
        result.push(pokemon);
        usedIds.add(pokemon.id);
      }
    }
    
    return result;
  };

  // Main function to start a new battle
  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    console.log("[createBattleStarter] Starting new battle with type:", battleType);
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    // Safety check for enough Pokemon
    if (!allPokemonForGeneration || allPokemonForGeneration.length < battleSize) {
      console.error("[createBattleStarter] Not enough Pokemon for battle:", 
                   allPokemonForGeneration?.length || 0);
      setCurrentBattle([]);
      return [];
    }

    const ranked = Array.isArray(currentFinalRankings) ? [...currentFinalRankings] : [];
    console.log("[createBattleStarter] ranked.length =", ranked.length);

    // Get unranked Pokemon - those in allPokemon but not in ranked
    const unranked = allPokemonForGeneration.filter(p => !ranked.some(r => r.id === p.id));

    // Create different tiers of Pokemon based on ranking
    const getSliceByCount = (list: Pokemon[], count: number) =>
      list.slice(0, Math.min(count, list.length));
    const getSliceByPercent = (list: Pokemon[], percent: number) =>
      list.slice(0, Math.floor((percent / 100) * list.length));

    // Create pools based on ranking tiers
    const T_Top10 = getSliceByPercent(ranked, 10);
    const T_Top20 = getSliceByCount(ranked, 20);
    const T_Top25 = getSliceByPercent(ranked, 25);
    const T_Top50 = getSliceByPercent(ranked, 50);
    const T_Bottom50 = ranked.filter(p => !T_Top50.includes(p));

    // Track attempts to find a non-repeated battle
    let maxAttempts = 10;
    let attemptCount = 0;
    let result: Pokemon[] = [];
    let battleId = "";
    
    // Try to find a unique battle that hasn't been seen recently
    while (attemptCount < maxAttempts) {
      // Try different combinations of Pokemon based on probability
      const r = roll();
      if (r < 15 && T_Top10.length && T_Top20.length) result = pickPokemonFromPools(T_Top10, T_Top20, battleSize);
      else if (r < 30 && T_Top10.length && T_Top25.length) result = pickPokemonFromPools(T_Top10, T_Top25, battleSize);
      else if (r < 50 && T_Top25.length && T_Top50.length) result = pickPokemonFromPools(T_Top25, T_Top50, battleSize);
      else if (r < 70 && T_Top50.length && T_Bottom50.length) result = pickPokemonFromPools(T_Top50, T_Bottom50, battleSize);
      else if (unranked.length && T_Top50.length) result = pickPokemonFromPools(unranked, T_Top50, battleSize);
      else if (unranked.length >= 2) result = pickPokemonFromPools(unranked, unranked, battleSize);
      
      // If we still don't have enough Pokemon, use random selection
      if (result.length < battleSize) {
        console.warn("[createBattleStarter] Tiered selection failed, using random selection");
        const availablePokemon = allPokemonForGeneration.filter(p => !recentlySeenPokemon.current.has(p.id));
        result = getUniqueRandomPokemon(
          availablePokemon.length >= battleSize ? availablePokemon : allPokemonForGeneration,
          battleSize
        );
      }
      
      // Check if this is a valid battle
      if (result.length === battleSize) {
        battleId = getBattleId(result.map(p => p.id));
        
        // Check if we've seen this battle before
        if (!previousBattlesRef.current.has(battleId)) {
          // Found a new battle, exit the loop
          break;
        }
      }
      
      // Try again
      attemptCount++;
    }
    
    // If we couldn't find a new battle, force a completely random one
    if (attemptCount >= maxAttempts || previousBattlesRef.current.has(battleId)) {
      console.warn("[createBattleStarter] Could not find unique battle, forcing completely random selection");
      result = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
      battleId = getBattleId(result.map(p => p.id));
    }
    
    // Update battle tracking
    console.log("[createBattleStarter] Selected battle:", result.map(p => p.name));
    
    // Store this battle ID in history
    const newSet = new Set(previousBattlesRef.current);
    // Limit history size to prevent memory issues
    if (newSet.size >= 100) {
      // Remove oldest entries (not perfect but good enough)
      const oldestEntries = Array.from(newSet).slice(0, 1);
      for (const entry of oldestEntries) {
        newSet.delete(entry);
      }
    }
    newSet.add(battleId);
    previousBattlesRef.current = newSet;
    
    // Update recently seen Pokemon
    const newIds = result.map(p => p.id);
    lastBattleRef.current = newIds;
    
    for (const id of newIds) {
      recentlySeenPokemon.current.add(id);
      // Limit size of recently seen set
      if (recentlySeenPokemon.current.size > 20) {
        const oldestId = Array.from(recentlySeenPokemon.current)[0];
        recentlySeenPokemon.current.delete(oldestId);
      }
    }

    // Update current battle and return
    setCurrentBattle(result);
    return result;
  };

  return { startNewBattle };
};
