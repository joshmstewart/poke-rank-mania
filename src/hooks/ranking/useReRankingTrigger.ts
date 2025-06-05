
import { useCallback, useRef, useEffect } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { RankedPokemon } from '@/services/pokemon';

export const useReRankingTrigger = () => {
  // Access store methods safely
  const { getRating, updateRating } = useTrueSkillStore();
  
  // CRITICAL FIX: Store the current rankings and update function in refs that can be set externally
  const localRankingsRef = useRef<RankedPokemon[]>([]);
  const updateLocalRankingsRef = useRef<(rankings: RankedPokemon[]) => void>(() => {});

  // CRITICAL FIX: Provide a method to set the current rankings and update function
  const setCurrentRankings = useCallback((rankings: RankedPokemon[], updateFn: (rankings: RankedPokemon[]) => void) => {
    localRankingsRef.current = rankings;
    updateLocalRankingsRef.current = updateFn;
  }, []);

  const triggerReRanking = useCallback((pokemonId: number) => {
    console.log(`🔄 [RE_RANKING_TRIGGER] Triggering re-ranking for Pokemon ID: ${pokemonId}`);
    
    if (!getRating || !updateRating) {
      console.error('[RE_RANKING_TRIGGER] Store methods not available');
      return;
    }

    try {
      // CRITICAL FIX: Get current rankings from ref at execution time
      const currentRankings = localRankingsRef.current;
      const currentUpdateFunction = updateLocalRankingsRef.current;
      
      if (currentRankings.length === 0) {
        console.warn('[RE_RANKING_TRIGGER] No rankings available');
        return;
      }
      
      const pokemonToUpdate = currentRankings.find(p => p.id === pokemonId);
      if (!pokemonToUpdate) {
        console.warn(`[RE_RANKING_TRIGGER] Pokemon ${pokemonId} not found in current rankings`);
        return;
      }

      const updatedRankings = currentRankings.map(pokemon => {
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
      currentUpdateFunction(sortedRankings);
      
      console.log(`🔄 [RE_RANKING_TRIGGER] ✅ Re-ranking completed successfully for Pokemon ${pokemonId}`);
    } catch (error) {
      console.error('[RE_RANKING_TRIGGER] Error during re-ranking:', error);
    }
  }, [getRating, updateRating]); // CRITICAL FIX: Only stable dependencies

  return { triggerReRanking, setCurrentRankings };
};
