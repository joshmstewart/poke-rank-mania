
import { useCallback } from 'react';
import { RankedPokemon } from '@/services/pokemon';

export const useReRankingTriggerSafe = (
  localRankings: RankedPokemon[],
  updateLocalRankings: (rankings: RankedPokemon[]) => void
) => {
  // Always create a trigger function, even if store is unavailable
  const triggerReRanking = useCallback(async (pokemonToRerank: RankedPokemon[]) => {
    console.log(`🔄 [SAFE_RE_RANKING_TRIGGER] Attempting re-ranking for ${pokemonToRerank.length} Pokemon`);
    
    try {
      // Dynamic import to avoid hook call issues
      const { useTrueSkillStore } = await import('@/stores/trueskillStore');
      const store = useTrueSkillStore.getState();
      
      if (!store.getRating || !store.updateRating) {
        console.warn('[SAFE_RE_RANKING_TRIGGER] Store methods not available');
        return;
      }

      const updatedRankings = localRankings.map(pokemon => {
        const needsUpdate = pokemonToRerank.some(p => p.id === pokemon.id);
        
        if (needsUpdate) {
          const rating = store.getRating(pokemon.id.toString());
          const conservativeEstimate = rating.mu - rating.sigma;
          const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
          
          console.log(`🔄 [SAFE_RE_RANKING_TRIGGER] Updated ${pokemon.name}: ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
          
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
      
      console.log(`🔄 [SAFE_RE_RANKING_TRIGGER] ✅ Re-ranking completed successfully`);
    } catch (error) {
      console.error('[SAFE_RE_RANKING_TRIGGER] Error during re-ranking:', error);
    }
  }, [localRankings, updateLocalRankings]);

  return { triggerReRanking };
};
