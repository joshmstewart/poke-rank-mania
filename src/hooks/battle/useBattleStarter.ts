import { useState, useRef } from "react";
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

  const pickDistinctPair = (pool: Pokemon[], seen: Set<number>) => {
    const filteredPool = pool.filter(p => !seen.has(p.id));
    if (filteredPool.length >= 2) {
      return shuffleArray(filteredPool).slice(0, 2);
    }
    return shuffleArray(pool).slice(0, 2);
  };

  const startNewBattle = (battleType: BattleType) => {
    battleCountRef.current++;
    const battleSize = battleType === "pairs" ? 2 : 3;

    let result: Pokemon[] = [];

    const allSeenPokemons = pokemonList.filter(p => recentlySeenPokemon.current.has(p.id));
    const unseenPokemons = pokemonList.filter(p => !recentlySeenPokemon.current.has(p.id));

    if (battleCountRef.current <= 100) {
      // Strongly repeat Pokémon for the first 100 battles
      if (allSeenPokemons.length >= battleSize) {
        result = shuffleArray(allSeenPokemons).slice(0, battleSize);
      } else {
        // Gradually introduce new Pokémon if needed
        result = pickDistinctPair(pokemonList, recentlySeenPokemon.current);
      }
    } else {
      // After 100 battles, switch to regular ranking-based logic
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
        const pair = pickDistinctPair([...poolA, ...poolB], recentlySeenPokemon.current);
        if (pair.length === battleSize) {
          result = pair;
          break;
        }
      }
    }

    // Ensure result is always populated
    if (result.length < battleSize) {
      result = shuffleArray(pokemonList).slice(0, battleSize);
    }

    // Update recently seen Pokémon
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
