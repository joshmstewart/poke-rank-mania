
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { RankedPokemon } from '@/services/pokemon';

export const useReRankingTrigger = (
  localRankings: RankedPokemon[],
  updateLocalRankings: (rankings: RankedPokemon[]) => void
) => {
  // Access store methods safely
  const { getRating, updateRating } = useTrueSkillStore();

  const triggerReRanking = useCallback((pokemonToRerank: RankedPokemon[]) => {
    console.log(`🔄 [RE_RANKING_TRIGGER] Triggering re-ranking for ${pokemonToRerank.length} Pokemon`);
    
    if (!getRating || !updateRating) {
      console.error('[RE_RANKING_TRIGGER] Store methods not available');
      return;
    }

    try {
      // CRITICAL FIX: Use current localRankings from the function scope
      // instead of relying on potentially stale state
      const updatedRankings = localRankings.map(pokemon => {
        const needsUpdate = pokemonToRerank.some(p => p.id === pokemon.id);
        
        if (needsUpdate) {
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
      
      console.log(`🔄 [RE_RANKING_TRIGGER] ✅ Re-ranking completed successfully`);
    } catch (error) {
      console.error('[RE_RANKING_TRIGGER] Error during re-ranking:', error);
    }
  }, [getRating, updateRating, updateLocalRankings]); // FIXED: Removed localRankings from dependencies

  return { triggerReRanking };
};
