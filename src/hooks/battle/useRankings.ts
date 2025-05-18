import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  const generateRankings = (results: SingleBattle[]) => {
    const scoreMap = new Map<number, number>();
    const countMap = new Map<number, number>();

    allPokemon.forEach(p => {
      scoreMap.set(p.id, 0);
      countMap.set(p.id, 0);
    });

    results.forEach(result => {
      const winnerId = result.winner.id;
      const loserId = result.loser.id;
      scoreMap.set(winnerId, (scoreMap.get(winnerId) || 0) + 1);
      scoreMap.set(loserId, (scoreMap.get(loserId) || 0));

      countMap.set(winnerId, (countMap.get(winnerId) || 0) + 1);
      countMap.set(loserId, (countMap.get(loserId) || 0) + 1);
    });

    const scoresWithPokemon = allPokemon.map(pokemon => {
      return {
        ...pokemon,
        score: scoreMap.get(pokemon.id) || 0,
        count: countMap.get(pokemon.id) || 0
      };
    });

    const sorted = scoresWithPokemon.sort((a, b) => b.score - a.score);
    setFinalRankings(sorted);

    const totalBattles = results.length;
    const expectedBattles = Math.max(1, totalBattles / allPokemon.length);
    const confidenceMap: Record<number, number> = {};

    scoresWithPokemon.forEach(p => {
      const c = Math.min(100, Math.round((p.count / expectedBattles) * 100));
      confidenceMap[p.id] = c;
    });

    setConfidenceScores(confidenceMap);
  };

  const handleSaveRankings = () => {
    console.log("[useRankings] Rankings saved.", finalRankings);
  };

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings
  };
};
