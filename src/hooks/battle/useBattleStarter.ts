import { useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const recentlySeenPokemon = useRef<Set<number>>(new Set());
  const battleCountRef = useRef(0);

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const pickDistinctPair = (pool: Pokemon[], seen: Set<number>, size: number) => {
    const filteredPool = pool.filter(p => !seen.has(p.id));
    if (filteredPool.length >= size) {
      return shuffleArray(filteredPool).slice(0, size);
    }
    return shuffleArray(pool).slice(0, size);
  };

  const startNewBattle = (battleType: BattleType) => {
    battleCountRef.current++;
    const battleSize = battleType === "pairs" ? 2 : 3;

    let result: Pokemon[] = [];

    if (battleCountRef.current <= 100) {
      const INITIAL_SUBSET_SIZE = 15; // Adjust size as desired

      // Initialize subset on first run
      if (recentlySeenPokemon.current.size === 0) {
        const initialSubset = shuffleArray(pokemonList).slice(0, INITIAL_SUBSET_SIZE);
        initialSubset.forEach(p => recentlySeenPokemon.current.add(p.id));
      }

      const initialSubsetPokemons = pokemonList.filter(p => recentlySeenPokemon.current.has(p.id));
      result = pickDistinctPair(initialSubsetPokemons, new Set(), battleSize);
    } else {
      const ranked = [...currentFinalRankings];
      const unranked = allPokemonForGeneration.filter(p => !ranked.some(r => r.id === p.id));

      const getSliceByPercent = (list: Pokemon[], percent: number) =>
        list.slice(0, Math.floor((percent / 100) * list.length));

      const T_Top25 = getSliceByPercent(ranked, 25);
      const T_Top50 = getSliceByPercent(ranked, 50);
      const T_Bottom50 = ranked.filter(p => !T_Top50.includes(p));

      const priorityOrder: [Pokemon[], Pokemon[]][] = [
        [T_Top25, T_Top25],
        [T_Top25, T_Top50],
        [T_Top50, T_Bottom50],
        [unranked, T_Top50],
        [unranked, unranked],
      ];

      for (const [poolA, poolB] of priorityOrder) {
        const pair = pickDistinctPair([...poolA, ...poolB], recentlySeenPokemon.current, battleSize);
        if (pair.length === battleSize) {
          result = pair;
          break;
        }
      }

      if (result.length < battleSize) {
        result = shuffleArray(pokemonList).slice(0, battleSize);
      }
    }

    // Maintain seen set capped at 50 entries
    result.forEach(p => {
      recentlySeenPokemon.current.add(p.id);
      if (recentlySeenPokemon.current.size > 50) {
        recentlySeenPokemon.current.delete([...recentlySeenPokemon.current][0]);
      }
    });

    setCurrentBattle(result);
    return result;
  };

  return { startNewBattle };
};
