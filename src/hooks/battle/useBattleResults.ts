import { useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export const useBattleResults = () => {
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]); 

  // Generate RankedPokemon list from battle results
  const getCurrentRankings = useCallback((): RankedPokemon[] => {
    if (!battleResults || battleResults.length === 0) return [];

    const scoreMap = new Map<number, number>();
    const countMap = new Map<number, number>();
    const pokemonMap = new Map<number, Pokemon>();

    battleResults.forEach((result: SingleBattle) => {
      const winner = result.winner;
      const loser = result.loser;

      // Update score (1 point per win)
      scoreMap.set(winner.id, (scoreMap.get(winner.id) || 0) + 1);
      // Update battle count
      countMap.set(winner.id, (countMap.get(winner.id) || 0) + 1);
      countMap.set(loser.id, (countMap.get(loser.id) || 0) + 1);

      // Store full Pokémon object (latest wins)
      if (!pokemonMap.has(winner.id)) pokemonMap.set(winner.id, winner);
      if (!pokemonMap.has(loser.id)) pokemonMap.set(loser.id, loser);
    });

    const ranked: RankedPokemon[] = [];

    pokemonMap.forEach((pokemon, id) => {
      const score = scoreMap.get(id) || 0;
      const count = countMap.get(id) || 0;
      const confidence = count > 0 ? score / count : 0;

      ranked.push({
        ...pokemon,
        score,
        count,
        confidence
      });
    });

    return ranked;
  }, [battleResults]);

  return {
    battleResults,
    setBattleResults,
    getCurrentRankings
  };
};
