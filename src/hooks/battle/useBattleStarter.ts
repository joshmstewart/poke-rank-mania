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

  const pickPokemonFromPools = (pool1: Pokemon[], pool2: Pokemon[]) => {
    if (!pool1.length || !pool2.length) return [];
    const used = new Set<number>();
    const result: Pokemon[] = [];

    const p1 = pool1[Math.floor(Math.random() * pool1.length)];
    if (p1) {
      result.push(p1);
      used.add(p1.id);
    }

    let attempts = 0;
    while (result.length < 2 && attempts < 10) {
      const p2 = pool2[Math.floor(Math.random() * pool2.length)];
      if (p2 && !used.has(p2.id)) {
        result.push(p2);
        break;
      }
      attempts++;
    }

    return result;
  };

  const startNewBattle = (battleType: BattleType) => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    if (allPokemonForGeneration.length < battleSize) {
      setCurrentBattle([]);
      return [];
    }

    const COLD_START_BATTLE_THRESHOLD = 100;
    let result: Pokemon[] = [];

    const pickUnseen = (pool: Pokemon[]) =>
      pool.filter(p => !recentlySeenPokemon.current.has(p.id));

    if (currentFinalRankings.length < COLD_START_BATTLE_THRESHOLD) {
      // Cold start logic
      const previouslySeenPokemon = pokemonList.filter(p => recentlySeenPokemon.current.has(p.id));

      const priorityOrderColdStart: [Pokemon[], Pokemon[]][] = [
        [previouslySeenPokemon, previouslySeenPokemon],
        [previouslySeenPokemon, pokemonList],
        [pokemonList, pokemonList]
      ];

      for (const [poolA, poolB] of priorityOrderColdStart) {
        const cleanA = pickUnseen(poolA);
        const cleanB = pickUnseen(poolB);
        const picked = pickPokemonFromPools(cleanA, cleanB);
        if (picked.length === battleSize) {
          result = picked;
          break;
        }
      }
    } else {
      // Regular ranking-driven logic
      const ranked = [...currentFinalRankings];
      const unranked = allPokemonForGeneration.filter(p => !ranked.some(r => r.id === p.id));

      const getSliceByCount = (list: Pokemon[], count: number) =>
        list.slice(0, Math.min(count, list.length));
      const getSliceByPercent = (list: Pokemon[], percent: number) =>
        list.slice(0, Math.floor((percent / 100) * list.length));

      const T_Top10 = getSliceByPercent(ranked, 10);
      const T_Top20 = getSliceByCount(ranked, 20);
      const T_Top25 = getSliceByPercent(ranked, 25);
      const T_Top50 = getSliceByPercent(ranked, 50);
      const T_Bottom50 = ranked.filter(p => !T_Top50.includes(p));

      const priorityOrder: [Pokemon[], Pokemon[]][] = [
        [T_Top10, T_Top20],
        [T_Top10, T_Top25],
        [T_Top25, T_Top50],
        [T_Top50, T_Bottom50],
        [unranked, T_Top50],
        [unranked, unranked],
      ];

      for (const [poolA, poolB] of priorityOrder) {
        const cleanA = pickUnseen(poolA);
        const cleanB = pickUnseen(poolB);
        const picked = pickPokemonFromPools(cleanA, cleanB);
        if (picked.length === battleSize) {
          result = picked;
          break;
        }
      }
    }

    // Fallback random pick if no result yet
    if (result.length < battleSize) {
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
    }

    // Check for repetition of the last battle
    const newIds = result.map(p => p.id).sort();
    const lastIds = [...lastBattleRef.current].sort();
    const isSame = newIds.every((id, i) => id === lastIds[i]);

    if (isSame || consecutiveRepeatsRef.current > 2) {
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
      consecutiveRepeatsRef.current++;
    } else {
      consecutiveRepeatsRef.current = 0;
    }

    // Track recent battles
    setPreviousBattles(prev => [...prev, newIds].slice(-10));
    lastBattleRef.current = newIds;
    newIds.forEach(id => {
      recentlySeenPokemon.current.add(id);
      if (recentlySeenPokemon.current.size > 30) {
        recentlySeenPokemon.current.delete([...recentlySeenPokemon.current][0]);
      }
    });

    setCurrentBattle(result);
    return result;
  };

  return { startNewBattle };
};
