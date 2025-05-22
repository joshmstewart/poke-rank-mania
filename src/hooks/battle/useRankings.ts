import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export interface SuggestedAdjustment {
  used: boolean;
}

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
  suggestedAdjustment?: SuggestedAdjustment;
}

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  const generateRankings = (results: SingleBattle[]) => {
    const scoreMap = new Map<number, number>();
    const countMap = new Map<number, number>();

    results.forEach(result => {
      scoreMap.set(result.winner.id, (scoreMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    const newRankings = allPokemon.map(p => ({
      ...p,
      score: scoreMap.get(p.id) || 0,
      count: countMap.get(p.id) || 0,
      suggestedAdjustment: { used: false },
    })).sort((a, b) => b.score - a.score);

    setFinalRankings(newRankings);
  };

  return { finalRankings, confidenceScores, generateRankings };
};
