
import { useState, useCallback, useEffect, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon, Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { Rating } from "ts-trueskill";

export const useTrueSkillSync = () => {
  const { getAllRatings, clearAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap, allPokemon } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  
  // CRITICAL FIX: Use refs to track context readiness for better effect triggering
  const contextReadyRef = useRef(false);
  const lastMapSizeRef = useRef(0);
  const lastAllPokemonLengthRef = useRef(0);

  console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CONTEXT_TRACK] Context state - Map size: ${pokemonLookupMap.size}, AllPokemon length: ${allPokemon.length}`);

  // Convert TrueSkill ratings to ranked Pokemon
  const convertRatingsToRankings = useCallback((ratings: Record<number, any>): RankedPokemon[] => {
    console.log(`🔥🔥🔥 [CONVERT_RATINGS] Called with ${Object.keys(ratings).length} ratings, context map size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [CONVERT_RATINGS] Context not ready - no Pokemon data (map size: 0)`);
      return [];
    }

    const ratedPokemonIds = Object.keys(ratings).map(Number);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [CONVERT_RATINGS] No TrueSkill ratings found - returning empty rankings`);
      return [];
    }

    console.log(`🔥🔥🔥 [CONVERT_RATINGS] Converting ${ratedPokemonIds.length} TrueSkill ratings to rankings`);

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
          wins: 0,
          losses: 0,
          winRate: 0
        });
      }
    });

    rankedPokemon.sort((a, b) => b.score - a.score);
    
    console.log(`🔥🔥🔥 [CONVERT_RATINGS] Generated ${rankedPokemon.length} ranked Pokemon`);
    return rankedPokemon;
  }, [pokemonLookupMap]);

  // CRITICAL FIX: Enhanced sync with better context readiness detection
  const syncWithTrueSkill = useCallback(() => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_TRIGGER] ===== SYNC TRIGGERED =====`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_TRIGGER] Context ready: ${pokemonLookupMap.size > 0}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_TRIGGER] Map size: ${pokemonLookupMap.size}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_TRIGGER] Retrieved ${ratingsCount} ratings from store`);
    
    const rankings = convertRatingsToRankings(allRatings);
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_TRIGGER] Setting local rankings: ${rankings.length} Pokemon`);
    setLocalRankings(rankings);
    
    return rankings;
  }, [getAllRatings, convertRatingsToRankings, pokemonLookupMap.size]);

  // CRITICAL FIX: Enhanced context readiness detection with manual change tracking
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_ENTRY] ===== MANUAL SYNC EFFECT ENTRY =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_ENTRY] pokemonLookupMap.size: ${pokemonLookupMap.size} (prev: ${lastMapSizeRef.current})`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_ENTRY] allPokemon.length: ${allPokemon.length} (prev: ${lastAllPokemonLengthRef.current})`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_ENTRY] contextReadyRef.current: ${contextReadyRef.current}`);
    
    // Check if context values actually changed
    const mapSizeChanged = pokemonLookupMap.size !== lastMapSizeRef.current;
    const allPokemonLengthChanged = allPokemon.length !== lastAllPokemonLengthRef.current;
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_ENTRY] mapSizeChanged: ${mapSizeChanged}, allPokemonLengthChanged: ${allPokemonLengthChanged}`);
    
    // Update refs
    lastMapSizeRef.current = pokemonLookupMap.size;
    lastAllPokemonLengthRef.current = allPokemon.length;
    
    const isContextReady = pokemonLookupMap.size > 0 && allPokemon.length > 0;
    const contextJustBecameReady = isContextReady && !contextReadyRef.current;
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_DETAIL] Context ready: ${isContextReady}, just became ready: ${contextJustBecameReady}`);
    
    if (isContextReady) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_DETAIL] ✅ Context is ready - performing sync`);
      contextReadyRef.current = true;
      syncWithTrueSkill();
    } else {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_DETAIL] ⚠️ Context not ready - waiting...`);
      contextReadyRef.current = false;
    }
  }, [pokemonLookupMap, allPokemon, syncWithTrueSkill]); // CRITICAL: Use the objects directly, not just size/length

  // Listen for TrueSkill store changes
  useEffect(() => {
    const handleStoreUpdated = () => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] Store updated - syncing...`);
      if (contextReadyRef.current) {
        syncWithTrueSkill();
      }
    };

    const handleStoreCleared = () => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] ===== STORE CLEARED - RESETTING LOCAL RANKINGS =====`);
      setLocalRankings([]);
      contextReadyRef.current = false;
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

  const handleManualSync = async () => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON] ===== MANUAL SYNC BUTTON CLICKED =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON] Context state - Map size: ${pokemonLookupMap.size}, AllPokemon: ${allPokemon.length}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON] TrueSkill ratings: ${ratingsCount}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON] Current local rankings: ${localRankings.length}`);
    
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
