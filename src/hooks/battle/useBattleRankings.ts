
import { useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { Rating } from "ts-trueskill";
import { RankedPokemon } from "@/services/pokemon";

export const useBattleRankings = () => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  const generateRankingsFromStore = useCallback(() => {
    console.log(`📊 [BATTLE_RANKINGS_FIXED] ===== GENERATING MILESTONE RANKINGS FROM STORE =====`);
    
    // Get all TrueSkill ratings from the centralized store
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`📊 [BATTLE_RANKINGS_FIXED] TrueSkill store contains ${ratedPokemonIds.length} rated Pokemon`);
    console.log(`📊 [BATTLE_RANKINGS_FIXED] Pokemon lookup map size: ${pokemonLookupMap.size}`);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`📊 [BATTLE_RANKINGS_FIXED] No TrueSkill ratings found, returning empty rankings`);
      return [];
    }

    // Create RankedPokemon objects from TrueSkill store (same as Manual mode)
    const rankings: RankedPokemon[] = [];
    
    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId];
      
      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma; // Changed from 3 * sigma to 1 * sigma
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: ratingData.battleCount || 0,
          wins: 0, // These would need to be calculated from battle history
          losses: 0,
          winRate: 0
        };
        
        rankings.push(rankedPokemon);
      } else {
        console.log(`📊 [BATTLE_RANKINGS_FIXED] ⚠️ Missing data for Pokemon ${pokemonId}: basePokemon=${!!basePokemon}, ratingData=${!!ratingData}`);
      }
    });
    
    // Sort by score (conservative estimate) - same as Manual mode
    rankings.sort((a, b) => b.score - a.score);
    
    console.log(`📊 [BATTLE_RANKINGS_FIXED] Generated ${rankings.length} rankings from TrueSkill store`);
    console.log(`📊 [BATTLE_RANKINGS_FIXED] Top 5 rankings:`, rankings.slice(0, 5).map(p => ({
      name: p.name,
      id: p.id,
      score: p.score.toFixed(3),
      confidence: p.confidence.toFixed(1)
    })));
    console.log(`📊 [BATTLE_RANKINGS_FIXED] ===== MILESTONE RANKINGS COMPLETE =====`);
    
    return rankings;
  }, [getAllRatings, pokemonLookupMap]);

  return {
    generateRankingsFromStore
  };
};
