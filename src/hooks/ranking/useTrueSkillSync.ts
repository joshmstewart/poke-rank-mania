
import { useState, useCallback, useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon, Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { Rating } from "ts-trueskill";

export const useTrueSkillSync = () => {
  const { getAllRatings, clearAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // Convert TrueSkill ratings to ranked Pokemon
  const convertRatingsToRankings = useCallback((ratings: Record<number, any>): RankedPokemon[] => {
    if (pokemonLookupMap.size === 0) {
      console.log(`🔥 [TRUESKILL_SYNC] Context not ready - no Pokemon data`);
      return [];
    }

    const ratedPokemonIds = Object.keys(ratings).map(Number);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥 [TRUESKILL_SYNC] No TrueSkill ratings found - returning empty rankings`);
      return [];
    }

    console.log(`🔥 [TRUESKILL_SYNC] Converting ${ratedPokemonIds.length} TrueSkill ratings to rankings`);

    const rankedPokemon: RankedPokemon[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const pokemon = pokemonLookupMap.get(pokemonId);
      const rating = ratings[pokemonId];
      
      if (pokemon && rating) {
        const tsRating = new Rating(rating.mu, rating.sigma);
        const score = tsRating.mu - (3 * tsRating.sigma);
        const confidence = Math.max(0, Math.min(100, (1 - (tsRating.sigma / 8.33)) * 100));

        rankedPokemon.push({
          ...pokemon,
          score: parseFloat(score.toFixed(2)),
          confidence: parseFloat(confidence.toFixed(1)),
          count: rating.battleCount || 0,
          wins: 0, // TrueSkill doesn't track individual wins/losses
          losses: 0,
          winRate: 0
        });
      }
    });

    // Sort by score (descending)
    rankedPokemon.sort((a, b) => b.score - a.score);
    
    console.log(`🔥 [TRUESKILL_SYNC] Generated ${rankedPokemon.length} ranked Pokemon`);
    return rankedPokemon;
  }, [pokemonLookupMap]);

  // Sync with TrueSkill store
  const syncWithTrueSkill = useCallback(() => {
    console.log(`🔥 [TRUESKILL_SYNC] ===== SYNC WITH TRUESKILL =====`);
    
    const allRatings = getAllRatings();
    const rankings = convertRatingsToRankings(allRatings);
    
    console.log(`🔥 [TRUESKILL_SYNC] Setting local rankings: ${rankings.length} Pokemon`);
    setLocalRankings(rankings);
    
    return rankings;
  }, [getAllRatings, convertRatingsToRankings]);

  // Listen for TrueSkill store changes
  useEffect(() => {
    const handleStoreUpdated = () => {
      console.log(`🔥 [TRUESKILL_SYNC] Store updated - syncing...`);
      syncWithTrueSkill();
    };

    const handleStoreCleared = () => {
      console.log(`🔥 [TRUESKILL_SYNC] ===== STORE CLEARED - RESETTING LOCAL RANKINGS =====`);
      setLocalRankings([]);
    };

    // Listen for store events
    document.addEventListener('trueskill-store-updated', handleStoreUpdated);
    document.addEventListener('trueskill-store-cleared', handleStoreCleared);
    document.addEventListener('trueskill-updated', handleStoreUpdated);

    return () => {
      document.removeEventListener('trueskill-store-updated', handleStoreUpdated);
      document.removeEventListener('trueskill-store-cleared', handleStoreCleared);
      document.removeEventListener('trueskill-updated', handleStoreUpdated);
    };
  }, [syncWithTrueSkill]);

  // Initial sync when context is ready
  useEffect(() => {
    if (pokemonLookupMap.size > 0) {
      console.log(`🔥 [TRUESKILL_SYNC] Context ready - performing initial sync`);
      syncWithTrueSkill();
    }
  }, [pokemonLookupMap.size, syncWithTrueSkill]);

  const handleManualSync = async () => {
    console.log(`🔥 [TRUESKILL_SYNC] Manual sync triggered`);
    const rankings = syncWithTrueSkill();
    
    if (rankings.length > 0) {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${rankings.length} ranked Pokemon from Battle Mode`,
        duration: 3000
      });
    } else {
      toast({
        title: "No Data",
        description: "No TrueSkill ratings found to sync",
        duration: 2000
      });
    }
  };

  return {
    localRankings,
    syncWithTrueSkill,
    handleManualSync
  };
};
