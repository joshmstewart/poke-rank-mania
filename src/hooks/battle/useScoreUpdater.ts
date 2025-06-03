
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { RankedPokemon } from '@/services/pokemon';

export const useScoreUpdater = (preventAutoResorting: boolean) => {
  const { getRating } = useTrueSkillStore();

  const updateScoresPreservingOrder = useCallback((
    rankings: RankedPokemon[], 
    movedPokemonId?: number
  ): RankedPokemon[] => {
    console.log('🔄 [SCORE_UPDATE] Updating scores, preventAutoResorting:', preventAutoResorting);
    
    let pokemonToUpdate: Set<number>;
    
    if (movedPokemonId !== undefined) {
      // Only update the moved Pokemon - this is user intent!
      pokemonToUpdate = new Set([movedPokemonId]);
      console.log('🔄 [SCORE_UPDATE] Updating only dragged Pokemon ID:', movedPokemonId);
    } else {
      // Fallback: Update all Pokemon
      pokemonToUpdate = new Set(rankings.map(p => p.id));
    }
    
    const updatedRankings = rankings.map((pokemon) => {
      const needsUpdate = pokemonToUpdate.has(pokemon.id);
      
      if (needsUpdate) {
        const rating = getRating(pokemon.id.toString());
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        console.log(`🔄 [SCORE_UPDATE] ${pokemon.name} score ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
        
        return {
          ...pokemon,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          mu: rating.mu,
          sigma: rating.sigma,
          count: pokemon.count || 0
        };
      } else {
        return pokemon;
      }
    });
    
    // Preserve order if preventAutoResorting is true
    if (preventAutoResorting) {
      console.log('🔄 [SCORE_UPDATE] ✅ Manual order preserved - no sorting');
      return updatedRankings;
    } else {
      console.log('🔄 [SCORE_UPDATE] Auto-resorting by score');
      return updatedRankings.sort((a, b) => b.score - a.score);
    }
  }, [getRating, preventAutoResorting]);

  return { updateScoresPreservingOrder };
};
