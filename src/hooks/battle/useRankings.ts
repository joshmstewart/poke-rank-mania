import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export interface SuggestedAdjustment {
  used: boolean;
  direction: "up" | "down";
  strength: 1 | 2 | 3;
}

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
  confidence: number;
  suggestedAdjustment?: SuggestedAdjustment;
}

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  const generateRankings = useCallback((results: SingleBattle[]) => {
    const scoreMap = new Map<number, number>();
    const countMap = new Map<number, number>();

    results.forEach(({ winner, loser }) => {
      scoreMap.set(winner.id, (scoreMap.get(winner.id) || 0) + 1);
      scoreMap.set(loser.id, scoreMap.get(loser.id) || 0);

      countMap.set(winner.id, (countMap.get(winner.id) || 0) + 1);
      countMap.set(loser.id, (countMap.get(loser.id) || 0) + 1);
    });

    const rankings: RankedPokemon[] = allPokemon
      .map((pokemon) => {
        const score = scoreMap.get(pokemon.id) || 0;
        const count = countMap.get(pokemon.id) || 0;
        const confidence = count > 0 ? score / count : 0;
        return { ...pokemon, score, count, confidence };
      })
      .sort((a, b) => b.score - a.score);

    setFinalRankings(rankings);

    const confidenceMap = rankings.reduce<Record<number, number>>((acc, p) => {
      acc[p.id] = p.confidence;
      return acc;
    }, {});

    setConfidenceScores(confidenceMap);

    return rankings;
  }, [allPokemon]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
    setFinalRankings(prev => prev.map(p => p.id === pokemon.id
      ? { ...p, suggestedAdjustment: { used: false, direction, strength } }
      : p));
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setFinalRankings(prev => prev.map(({ suggestedAdjustment, ...rest }) => rest));
  }, []);

  const markSuggestionUsed = useCallback((pokemonId: number) => {
    setFinalRankings(prev => prev.map(p => p.id === pokemonId && p.suggestedAdjustment
      ? { ...p, suggestedAdjustment: { ...p.suggestedAdjustment, used: true } }
      : p));
  }, []);

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    suggestRanking,
    clearAllSuggestions,
    markSuggestionUsed,
  };
};
