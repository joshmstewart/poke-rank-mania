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

    let result: Pokemon[] = [];

    const r = roll();
    if (r < 15 && T_Top10.length && T_Top20.length) result = pickPokemonFromPools(T_Top10, T_Top20);
    else if (r < 30 && T_Top10.length && T_Top25.length) result = pickPokemonFromPools(T_Top10, T_Top25);
    else if (r < 50 && T_Top25.length && T_Top50.length) result = pickPokemonFromPools(T_Top25, T_Top50);
    else if (r < 70 && T_Top50.length && T_Bottom50.length) result = pickPokemonFromPools(T_Top50, T_Bottom50);
    else if (unranked.length && T_Top50.length) result = pickPokemonFromPools(unranked, T_Top50);
    else if (unranked.length >= 2) result = pickPokemonFromPools(unranked, unranked);

    if (result.length < battleSize) {
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
    }

    const newIds = result.map(p => p.id).sort();
    const lastIds = [...lastBattleRef.current].sort();
    const isSame = newIds.every((id, i) => id === lastIds[i]);

    if (isSame || consecutiveRepeatsRef.current > 2) {
      result = shuffleArray([...allPokemonForGeneration]).slice(0, battleSize);
      consecutiveRepeatsRef.current++;
    } else {
      consecutiveRepeatsRef.current = 0;
    }

    setPreviousBattles(prev => [...prev, newIds].slice(-10));
    lastBattleRef.current = newIds;
    newIds.forEach(id => {
      recentlySeenPokemon.current.add(id);
      if (recentlySeenPokemon.current.size > 20) {
        recentlySeenPokemon.current.delete([...recentlySeenPokemon.current][0]);
      }
    });

    setCurrentBattle(result);
    return result;
  };

  return { startNewBattle };
};
