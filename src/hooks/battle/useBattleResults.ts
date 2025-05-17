
import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult } from "./types";

export const useBattleResults = () => {
  const [battleResults, setBattleResults] = useState<BattleResult>([]);

  // Generate current rankings from battle results
  const getCurrentRankings = useCallback((): Pokemon[] => {
    if (!battleResults || battleResults.length === 0) return [];

    const pokemonMap = new Map<number, Pokemon>();

    battleResults.forEach(result => {
      if (!pokemonMap.has(result.winner.id)) {
        pokemonMap.set(result.winner.id, result.winner);
      }
    });

    battleResults.forEach(result => {
      if (!pokemonMap.has(result.loser.id)) {
        pokemonMap.set(result.loser.id, result.loser);
      }
    });

    return Array.from(pokemonMap.values());
  }, [battleResults]);

  return {
    battleResults,
    setBattleResults,
    getCurrentRankings
  };
};
