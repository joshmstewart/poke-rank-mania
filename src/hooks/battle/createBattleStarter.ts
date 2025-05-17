
import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const [previousBattles, setPreviousBattles] = useState<number[][]>([]);
  const lastBattleRef = useRef<number[]>([]);
  const recentlySeenPokemon = useRef<Set<number>>(new Set());
  const consecutiveRepeatsRef = useRef(0);

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
    
    // Create copies to avoid mutating the original arrays
    const pool1Copy = [...pool1];
    const pool2Copy = [...pool2];
    
    // Filter out recently seen Pokemon
    const filteredPool1 = pool1Copy.filter(p => !recentlySeenPokemon.current.has(p.id));
    const filteredPool2 = pool2Copy.filter(p => !recentlySeenPokemon.current.has(p.id));
    
    // Use filtered pools if they have enough Pokemon, otherwise use original pools
    const usePool1 = filteredPool1.length > 0 ? filteredPool1 : pool1Copy;
    const usePool2 = filteredPool2.length > 0 ? filteredPool2 : pool2Copy;
    
    const used = new Set<number>();
    const result: Pokemon[] = [];

    // Pick from first pool
    const randomIdx1 = Math.floor(Math.random() * usePool1.length);
    const p1 = usePool1[randomIdx1];
    if (p1) {
      result.push(p1);
      used.add(p1.id);
    }

    // Pick from second pool with more attempts to avoid duplicates
    let attempts = 0;
    const maxAttempts = 20; // Increase attempts to find a different Pokemon
    while (result.length < 2 && attempts < maxAttempts) {
      const randomIdx2 = Math.floor(Math.random() * usePool2.length);
      const p2 = usePool2[randomIdx2];
      if (p2 && !used.has(p2.id)) {
        result.push(p2);
        break;
      }
      attempts++;
    }

    return result;
  };

  const startNewBattle = (battleType: BattleType) => {
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

    let result: Pokemon[] = [];
    console.log("[createBattleStarter] T_Top10:", T_Top10.length);
    console.log("[createBattleStarter] T_Top50:", T_Top50.length);
    console.log("[createBattleStarter] unranked:", unranked.length);

    // First try to get Pokemon from different pools based on probability
    const r = roll();
    if (r < 15 && T_Top10.length && T_Top20.length) result = pickPokemonFromPools(T_Top10, T_Top20);
    else if (r < 30 && T_Top10.length && T_Top25.length) result = pickPokemonFromPools(T_Top10, T_Top25);
    else if (r < 50 && T_Top25.length && T_Top50.length) result = pickPokemonFromPools(T_Top25, T_Top50);
    else if (r < 70 && T_Top50.length && T_Bottom50.length) result = pickPokemonFromPools(T_Top50, T_Bottom50);
    else if (unranked.length && T_Top50.length) result = pickPokemonFromPools(unranked, T_Top50);
    else if (unranked.length >= 2) result = pickPokemonFromPools(unranked, unranked);

    // Fallback if we still don't have enough Pokemon
    if (result.length < battleSize) {
      console.warn("[createBattleStarter] Tiered selection failed — using random fallback");
      
      // Get a list of Pokemon not recently seen if possible
      const notRecentlySeen = allPokemonForGeneration.filter(p => !recentlySeenPokemon.current.has(p.id));
      
      // If we have enough Pokemon not recently seen, use them, otherwise use all
      const poolToUse = notRecentlySeen.length >= battleSize ? notRecentlySeen : allPokemonForGeneration;
      result = shuffleArray(poolToUse).slice(0, battleSize);
    }

    // Check if this battle is identical to the previous one
    const newIds = result.map(p => p.id).sort();
    const lastIds = Array.isArray(lastBattleRef.current) ? [...lastBattleRef.current].sort() : [];
    
    // Compare the arrays to see if they contain the same Pokemon IDs
    const isSame = newIds.length === lastIds.length && 
                   newIds.every((id, i) => id === lastIds[i]);

    // If we got the same battle or we've had too many repeats, force a completely random selection
    if (isSame || consecutiveRepeatsRef.current > 2) {
      console.warn("[createBattleStarter] Detected repeat battle, forcing random selection");
      // Shuffle the entire Pokemon list and take the first battleSize elements
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
      consecutiveRepeatsRef.current++;
    } else {
      consecutiveRepeatsRef.current = 0;
    }

    // Update state for tracking previous battles
    setPreviousBattles(prev => [...prev, newIds].slice(-10));
    lastBattleRef.current = newIds;
    
    // Update recently seen Pokemon
    newIds.forEach(id => {
      recentlySeenPokemon.current.add(id);
      // Remove oldest entries if we have too many
      if (recentlySeenPokemon.current.size > 20) {
        recentlySeenPokemon.current.delete([...recentlySeenPokemon.current][0]);
      }
    });

    // Update battle and return result
    setCurrentBattle(result);
    console.log("✅ Final selected Pokémon:", result.map(p => p.name));
    return result;
  };

  return { startNewBattle };
};
