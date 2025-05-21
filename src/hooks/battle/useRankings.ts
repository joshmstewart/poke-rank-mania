import { useState, useEffect, useRef, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";
import { useRankingSuggestions } from "./useRankingSuggestions";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);

  const { loadSavedSuggestions, activeSuggestions } = useRankingSuggestions(finalRankings, setFinalRankings);

  useEffect(() => {
    loadSavedSuggestions();
  }, [loadSavedSuggestions]);

  const generateRankings = useCallback((results: SingleBattle[]) => {
    const countMap = new Map<number, number>();

    results.forEach(result => {
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    const ranked = allPokemon
      .filter(p => countMap.has(p.id))
      .map(p => {
        if (!p.rating) p.rating = new Rating();
        else if (!(p.rating instanceof Rating)) p.rating = new Rating(p.rating.mu, p.rating.sigma);

        const confidence = p.rating.mu - 3 * p.rating.sigma;
        const suggestion = activeSuggestions.get(p.id);

        return {
          ...p,
          score: confidence,
          count: countMap.get(p.id),
          confidence: Math.max(0, Math.min(100, 100 * (1 - (p.rating.sigma / 8.33)))),
          suggestedAdjustment: suggestion
        };
      })
      .sort((a, b) => b.score - a.score);

    setFinalRankings(ranked);
    return ranked;
  }, [allPokemon, activeSuggestions]);

  return { finalRankings, generateRankings };
};
