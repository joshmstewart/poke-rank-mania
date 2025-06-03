
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { RankedPokemon } from '@/services/pokemon';

export const useReRankingTrigger = (
  localRankings: RankedPokemon[],
  updateLocalRankings: (rankings: RankedPokemon[]) => void
) => {
  // Add error handling for the store access
  let getRating, updateRating;
  
  try {
    const store = useTrueSkillStore();
    if (!store) {
      console.error('[RE_RANKING_TRIGGER] Store is null or undefined');
      return {
        triggerReRanking: () => {
          console.warn('[RE_RANKING_TRIGGER] Cannot trigger re-ranking - store unavailable');
        }
      };
    }
    getRating = store.getRating;
    updateRating = store.updateRating;
  } catch (error) {
    console.error('[RE_RANKING_TRIGGER] Error accessing TrueSkill store:', error);
    return {
      triggerReRanking: () => {
        console.warn('[RE_RANKING_TRIGGER] Cannot trigger re-ranking - store error');
      }
    };
  }

  const triggerReRanking = useCallback((pokemonToRerank: RankedPokemon[]) => {
    console.log(`🔄 [RE_RANKING_TRIGGER] Triggering re-ranking for ${pokemonToRerank.length} Pokemon`);
    
    if (!getRating || !updateRating) {
      console.error('[RE_RANKING_TRIGGER] Store methods not available');
      return;
    }

    try {
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
  }, [localRankings, updateLocalRankings, getRating, updateRating]);

  return { triggerReRanking };
};
