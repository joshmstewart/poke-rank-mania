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
      scoreMap.set(loserId, scoreMap.get(loserId) || 0);

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

    // Confidence is relative to active Pokémon
    const log2N = Math.log2(scoresWithPokemon.length || 1);
    const confidenceMap: Record<number, number> = {};
    scoresWithPokemon.forEach(p => {
      const confidence = Math.min(1, p.count / log2N);
      confidenceMap[p.id] = Math.round(confidence * 100);
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
