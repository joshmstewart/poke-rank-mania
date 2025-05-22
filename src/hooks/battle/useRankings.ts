import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export interface SuggestedAdjustment {
  used: boolean;
  direction: "up" | "down";
}

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
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
      .map((pokemon) => ({
        ...pokemon,
        score: scoreMap.get(pokemon.id) || 0,
        count: countMap.get(pokemon.id) || 0,
      }))
      .sort((a, b) => b.score - a.score);

    setFinalRankings(rankings);

    // Calculate simple confidence scores as placeholders
    const confidence = rankings.reduce<Record<number, number>>((acc, pokemon) => {
      acc[pokemon.id] = pokemon.count > 0 ? pokemon.score / pokemon.count : 0;
      return acc;
    }, {});

    setConfidenceScores(confidence);

    return rankings;
  }, [allPokemon]);

  const suggestRanking = useCallback((pokemonId: number, direction: "up" | "down") => {
    setFinalRankings((prev) =>
      prev.map((pokemon) =>
        pokemon.id === pokemonId
          ? { ...pokemon, suggestedAdjustment: { used: false, direction } }
          : pokemon
      )
    );
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setFinalRankings((prev) =>
      prev.map(({ suggestedAdjustment, ...pokemon }) => pokemon)
    );
  }, []);

  const markSuggestionUsed = useCallback((pokemonId: number) => {
    setFinalRankings((prev) =>
      prev.map((pokemon) =>
        pokemon.id === pokemonId && pokemon.suggestedAdjustment
          ? {
              ...pokemon,
              suggestedAdjustment: { ...pokemon.suggestedAdjustment, used: true },
            }
          : pokemon
      )
    );
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
