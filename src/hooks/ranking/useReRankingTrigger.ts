
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { RankedPokemon } from '@/services/pokemon';

export const useReRankingTrigger = (
  localRankings: RankedPokemon[],
  updateLocalRankings: (rankings: RankedPokemon[]) => void
) => {
  // Access store methods safely
  const { getRating, updateRating } = useTrueSkillStore();

  const triggerReRanking = useCallback((pokemonId: number) => {
    console.log(`🔄 [RE_RANKING_TRIGGER] Triggering re-ranking for Pokemon ID: ${pokemonId}`);
    
    if (!getRating || !updateRating) {
      console.error('[RE_RANKING_TRIGGER] Store methods not available');
      return;
    }

    try {
      // CRITICAL FIX: Get current rankings at the time of execution
      // Find the specific pokemon to update
      const pokemonToUpdate = localRankings.find(p => p.id === pokemonId);
      if (!pokemonToUpdate) {
        console.warn(`[RE_RANKING_TRIGGER] Pokemon ${pokemonId} not found in current rankings`);
        return;
      }

      const updatedRankings = localRankings.map(pokemon => {
        if (pokemon.id === pokemonId) {
          const rating = getRating(pokemon.id.toString());
          const conservativeEstimate = rating.mu - rating.sigma;
          const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
          
          console.log(`🔄 [RE_RANKING_TRIGGER] Updated ${pokemon.name}: ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
          
          return {
            ...pokemon,
            score: conservativeEstimate,
            confidence: confidence,
            rating: rating,
            mu: rating.mu,
            sigma: rating.sigma
          };
        }
        
        return pokemon;
      });

      // Sort by score and update
      const sortedRankings = updatedRankings.sort((a, b) => b.score - a.score);
      updateLocalRankings(sortedRankings);
      
      console.log(`🔄 [RE_RANKING_TRIGGER] ✅ Re-ranking completed successfully for Pokemon ${pokemonId}`);
    } catch (error) {
      console.error('[RE_RANKING_TRIGGER] Error during re-ranking:', error);
    }
  }, [getRating, updateRating, updateLocalRankings, localRankings]); // Include localRankings for fresh data

  return { triggerReRanking };
};
