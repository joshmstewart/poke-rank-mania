import { useState } from 'react';
import { Pokemon } from '@/services/pokemon';
import { SingleBattle } from './types';

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
  confidence: number;
  suggestedAdjustment?: {
    direction: 'up' | 'down';
    used: boolean;
  };
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

    const rankings: RankedPokemon[] = allPokemon.map(pokemon => {
      const wins = scoreMap.get(pokemon.id) || 0;
      const total = countMap.get(pokemon.id) || 0;
      const confidence = total ? wins / total : 0;

      return {
        ...pokemon,
        score: wins,
        count: total,
        confidence,
      };
    });

    rankings.sort((a, b) => b.confidence - a.confidence);
    setFinalRankings(rankings);
    setConfidenceScores(rankings.reduce((acc, curr) => {
      acc[curr.id] = curr.confidence;
      return acc;
    }, {} as Record<number, number>));

    return rankings;
  };

  const suggestRanking = (pokemonId: number, direction: 'up' | 'down') => {
    setFinalRankings(prevRankings =>
      prevRankings.map(pokemon =>
        pokemon.id === pokemonId
          ? {
              ...pokemon,
              suggestedAdjustment: { direction, used: false },
            }
          : pokemon
      )
    );
  };

  const clearAllSuggestions = () => {
    setFinalRankings(prevRankings =>
      prevRankings.map(({ suggestedAdjustment, ...pokemon }) => ({
        ...pokemon,
      }))
    );
  };

  const markSuggestionUsed = (pokemonId: number) => {
    setFinalRankings(prevRankings =>
      prevRankings.map(pokemon =>
        pokemon.id === pokemonId && pokemon.suggestedAdjustment
          ? {
              ...pokemon,
              suggestedAdjustment: {
                ...pokemon.suggestedAdjustment,
                used: true,
              },
            }
          : pokemon
      )
    );
  };

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    suggestRanking,
    clearAllSuggestions,
    markSuggestionUsed,
  };
};
