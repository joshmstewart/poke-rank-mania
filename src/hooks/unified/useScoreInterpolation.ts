
import { useCallback } from 'react';
import { RankedPokemon } from '@/services/pokemon';

export const useScoreInterpolation = () => {
  const calculateInsertionScore = useCallback((
    rankedPokemon: RankedPokemon[],
    insertionIndex: number
  ): number => {
    // If inserting at the beginning
    if (insertionIndex === 0) {
      if (rankedPokemon.length === 0) {
        return 1000; // Default high score for first Pokemon
      }
      // Give a score higher than the current first Pokemon
      return rankedPokemon[0].score + 100;
    }

    // If inserting at the end
    if (insertionIndex >= rankedPokemon.length) {
      if (rankedPokemon.length === 0) {
        return 1000; // Default high score for first Pokemon
      }
      // Give a score lower than the current last Pokemon
      return rankedPokemon[rankedPokemon.length - 1].score - 100;
    }

    // If inserting between two Pokemon, interpolate their scores
    const prevScore = rankedPokemon[insertionIndex - 1].score;
    const nextScore = rankedPokemon[insertionIndex].score;
    
    // Calculate the midpoint between the two scores
    return (prevScore + nextScore) / 2;
  }, []);

  const updatePokemonScore = useCallback((
    pokemon: any,
    newScore: number
  ): RankedPokemon => {
    return {
      ...pokemon,
      score: newScore,
      // Ensure it has all RankedPokemon properties
      rank: 0, // Will be recalculated based on final order
    } as RankedPokemon;
  }, []);

  return {
    calculateInsertionScore,
    updatePokemonScore,
  };
};
