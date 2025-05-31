
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
  
  // CRITICAL FIX: Enhanced context readiness tracking
  const contextReadyRef = useRef(false);
  const lastSyncedRatingsCountRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Hook execution - Map size: ${pokemonLookupMap.size}, AllPokemon length: ${allPokemon.length}`);

  // Convert TrueSkill ratings to ranked Pokemon
  const convertRatingsToRankings = useCallback((ratings: Record<number, any>): RankedPokemon[] => {
    console.log(`🔥🔥🔥 [CONVERT_RATINGS_CRITICAL] Called with ${Object.keys(ratings).length} ratings, context map size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [CONVERT_RATINGS_CRITICAL] ❌ Context not ready - no Pokemon data (map size: 0)`);
      return [];
    }

    const ratedPokemonIds = Object.keys(ratings).map(Number);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [CONVERT_RATINGS_CRITICAL] No TrueSkill ratings found - returning empty rankings`);
      return [];
    }

    console.log(`🔥🔥🔥 [CONVERT_RATINGS_CRITICAL] Converting ${ratedPokemonIds.length} TrueSkill ratings to rankings`);

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
      } else {
        console.log(`🔥🔥🔥 [CONVERT_RATINGS_CRITICAL] ⚠️ Missing data for Pokemon ${pokemonId} - pokemon: ${!!pokemon}, rating: ${!!rating}`);
      }
    });

    rankedPokemon.sort((a, b) => b.score - a.score);
    
    console.log(`🔥🔥🔥 [CONVERT_RATINGS_CRITICAL] ✅ Generated ${rankedPokemon.length} ranked Pokemon`);
    return rankedPokemon;
  }, [pokemonLookupMap]);

  // CRITICAL FIX: Enhanced sync with better context readiness detection and debouncing
  const syncWithTrueSkill = useCallback(() => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== SYNC TRIGGERED =====`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Context ready: ${pokemonLookupMap.size > 0}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Map size: ${pokemonLookupMap.size}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] AllPokemon length: ${allPokemon.length}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Retrieved ${ratingsCount} ratings from store`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Last synced count: ${lastSyncedRatingsCountRef.current}`);
    
    // Only proceed if context is ready
    if (pokemonLookupMap.size === 0 || allPokemon.length === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ⚠️ Context not ready - deferring sync`);
      contextReadyRef.current = false;
      return [];
    }
    
    contextReadyRef.current = true;
    lastSyncedRatingsCountRef.current = ratingsCount;
    
    const rankings = convertRatingsToRankings(allRatings);
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Setting local rankings: ${rankings.length} Pokemon`);
    setLocalRankings(rankings);
    
    return rankings;
  }, [getAllRatings, convertRatingsToRankings, pokemonLookupMap.size, allPokemon.length]);

  // CRITICAL FIX: Enhanced effect with proper dependency tracking and cleanup
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== EFFECT ENTRY =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] pokemonLookupMap.size: ${pokemonLookupMap.size}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] allPokemon.length: ${allPokemon.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] contextReadyRef.current: ${contextReadyRef.current}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Current ratings count: ${Object.keys(getAllRatings()).length}`);
    
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    const isContextReady = pokemonLookupMap.size > 0 && allPokemon.length > 0;
    const contextJustBecameReady = isContextReady && !contextReadyRef.current;
    const ratingsCount = Object.keys(getAllRatings()).length;
    const ratingsChanged = ratingsCount !== lastSyncedRatingsCountRef.current;
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Context ready: ${isContextReady}, just became ready: ${contextJustBecameReady}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Ratings changed: ${ratingsChanged} (${lastSyncedRatingsCountRef.current} -> ${ratingsCount})`);
    
    if (isContextReady && (contextJustBecameReady || ratingsChanged)) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ✅ Triggering sync - context ready and data changed`);
      
      // Use a small timeout to ensure React has finished all updates
      syncTimeoutRef.current = setTimeout(() => {
        syncWithTrueSkill();
      }, 50);
    } else if (!isContextReady) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ⚠️ Context not ready - waiting...`);
      contextReadyRef.current = false;
    } else {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ℹ️ No sync needed - context ready but no changes`);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [pokemonLookupMap.size, allPokemon.length, getAllRatings, syncWithTrueSkill]);

  // Listen for TrueSkill store changes
  useEffect(() => {
    const handleStoreUpdated = () => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Store updated event - triggering sync...`);
      if (contextReadyRef.current) {
        // Use timeout to allow other state updates to complete
        setTimeout(() => {
          syncWithTrueSkill();
        }, 100);
      } else {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Context not ready for store update - deferring`);
      }
    };

    const handleStoreCleared = () => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== STORE CLEARED - RESETTING LOCAL RANKINGS =====`);
      setLocalRankings([]);
      contextReadyRef.current = false;
      lastSyncedRatingsCountRef.current = 0;
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
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON_CRITICAL] ===== MANUAL SYNC BUTTON CLICKED =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON_CRITICAL] Context state - Map size: ${pokemonLookupMap.size}, AllPokemon: ${allPokemon.length}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON_CRITICAL] TrueSkill ratings: ${ratingsCount}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_BUTTON_CRITICAL] Current local rankings: ${localRankings.length}`);
    
    const rankings = syncWithTrueSkill();
    
    if (rankings.length > 0) {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${rankings.length} ranked Pokemon from Battle Mode`,
        duration: 3000
      });
    } else if (ratingsCount > 0 && pokemonLookupMap.size === 0) {
      toast({
        title: "Context Loading",
        description: "Pokemon data is still loading. Rankings will appear automatically when ready.",
        duration: 2000
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
