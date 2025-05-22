import { useState } from 'react';
import { Pokemon } from '@/services/pokemon';
import { SingleBattle } from './types';

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
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

    const ranked = allPokemon.map(pokemon => ({
      ...pokemon,
      score: scoreMap.get(pokemon.id) || 0,
      count: countMap.get(pokemon.id) || 0,
    })).sort((a, b) => b.score - a.score);

    setFinalRankings(ranked);
    return ranked;
  };

  const suggestRanking = (pokemonId: number, direction: 'up' | 'down') => {
    setFinalRankings(prev => prev.map(p => p.id === pokemonId ? {
      ...p,
      suggestedAdjustment: { direction, used: false },
    } : p));
  };

  const markSuggestionUsed = (pokemonId: number) => {
    setFinalRankings(prev => prev.map(p => p.id === pokemonId && p.suggestedAdjustment ? {
      ...p,
      suggestedAdjustment: { ...p.suggestedAdjustment, used: true },
    } : p));
  };

  const clearAllSuggestions = () => {
    setFinalRankings(prev => prev.map(p => ({
      ...p,
      suggestedAdjustment: undefined,
    })));
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
