import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
}

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  const generateRankings = (results: SingleBattle[]) => {
    const scoreMap = new Map<number, number>();
    const countMap = new Map<number, number>();
    const pokemonSeen = new Set<number>();

    results.forEach(result => {
      const winnerId = result.winner.id;
      const loserId = result.loser.id;

      scoreMap.set(winnerId, (scoreMap.get(winnerId) || 0) + 1);
      scoreMap.set(loserId, scoreMap.get(loserId) || 0); // losers get no points

      countMap.set(winnerId, (countMap.get(winnerId) || 0) + 1);
      countMap.set(loserId, (countMap.get(loserId) || 0) + 1);

      pokemonSeen.add(winnerId);
      pokemonSeen.add(loserId);
    });

    const scoresWithPokemon: RankedPokemon[] = allPokemon
      .filter(p => pokemonSeen.has(p.id))
      .map(p => ({
        ...p,
        score: scoreMap.get(p.id) || 0,
        count: countMap.get(p.id) || 0
      }));

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
