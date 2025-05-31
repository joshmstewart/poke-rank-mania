
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
  
  // CRITICAL FIX: Prevent sync repetition and track state changes
  const syncInProgressRef = useRef(false);
  const lastSyncedCountRef = useRef(0);
  const initializedRef = useRef(false);

  console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ENTRY] Hook execution - Map size: ${pokemonLookupMap.size}, AllPokemon length: ${allPokemon.length}`);

  // CRITICAL FIX: Store clearing function with comprehensive logging
  const clearRankingsStore = useCallback(() => {
    console.log(`🚨🚨🚨 [STORE_CLEAR_INITIATED] ===== CLEARING TRUESKILL STORE =====`);
    const currentRatings = getAllRatings();
    const beforeCount = Object.keys(currentRatings).length;
    console.log(`🚨🚨🚨 [STORE_CLEAR_BEFORE] Store count before clear: ${beforeCount}`);
    
    // Clear the store
    clearAllRatings();
    
    // Clear local rankings
    setLocalRankings([]);
    lastSyncedCountRef.current = 0;
    
    // Verify clearing worked
    const afterRatings = getAllRatings();
    const afterCount = Object.keys(afterRatings).length;
    console.log(`🚨🚨🚨 [STORE_CLEAR_AFTER] Store count after clear: ${afterCount}`);
    console.log(`🚨🚨🚨 [STORE_CLEAR_COMPLETE] Local rankings cleared, count reset to 0`);
    
    // Dispatch clear event
    setTimeout(() => {
      const clearEvent = new CustomEvent('trueskill-store-cleared', {
        detail: { previousCount: beforeCount, newCount: afterCount }
      });
      document.dispatchEvent(clearEvent);
    }, 100);
  }, [clearAllRatings, getAllRatings]);

  // Convert TrueSkill ratings to ranked Pokemon
  const convertRatingsToRankings = useCallback((ratings: Record<number, any>): RankedPokemon[] => {
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_START] ===== CONVERSION START =====`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_INPUT] Input ratings count: ${Object.keys(ratings).length}`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_CONTEXT] Context map size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size === 0) {
      console.log(`🚨🚨🚨 [CONVERT_RATINGS_ERROR] Context not ready - no Pokemon data (map size: 0)`);
      return [];
    }

    const ratedPokemonIds = Object.keys(ratings).map(Number);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🚨🚨🚨 [CONVERT_RATINGS_EMPTY] No TrueSkill ratings found - returning empty rankings`);
      return [];
    }

    console.log(`🚨🚨🚨 [CONVERT_RATINGS_PROCESS] Converting ${ratedPokemonIds.length} TrueSkill ratings to rankings`);

    const rankedPokemon: RankedPokemon[] = [];
    let foundCount = 0;

    ratedPokemonIds.forEach(pokemonId => {
      const pokemon = pokemonLookupMap.get(pokemonId);
      const rating = ratings[pokemonId];
      
      if (pokemon && rating) {
        foundCount++;
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
    
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_COMPLETE] ===== CONVERSION COMPLETE =====`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_SUCCESS] Successfully converted: ${foundCount} Pokemon`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_FINAL] Final ranked Pokemon count: ${rankedPokemon.length}`);
    
    return rankedPokemon;
  }, [pokemonLookupMap]);

  // CRITICAL FIX: Simplified sync with data validation
  const syncWithTrueSkill = useCallback(() => {
    // Prevent multiple simultaneous syncs
    if (syncInProgressRef.current) {
      console.log(`🚨🚨🚨 [SYNC_BLOCKED] Sync already in progress - skipping`);
      return [];
    }

    syncInProgressRef.current = true;
    
    console.log(`🚨🚨🚨 [SYNC_START] ===== SYNC TRIGGERED =====`);
    console.log(`🚨🚨🚨 [SYNC_CONTEXT] Context ready: ${pokemonLookupMap.size > 0}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🚨🚨🚨 [SYNC_STORE_ANALYSIS] ===== TRUESKILL STORE ANALYSIS =====`);
    console.log(`🚨🚨🚨 [SYNC_STORE_COUNT] Store ratings count: ${ratingsCount}`);
    console.log(`🚨🚨🚨 [SYNC_LAST_COUNT] Last synced count: ${lastSyncedCountRef.current}`);
    
    // Only proceed if context is ready
    if (pokemonLookupMap.size === 0 || allPokemon.length === 0) {
      console.log(`🚨🚨🚨 [SYNC_DEFER] Context not ready - deferring sync`);
      syncInProgressRef.current = false;
      return [];
    }
    
    lastSyncedCountRef.current = ratingsCount;
    
    const rankings = convertRatingsToRankings(allRatings);
    
    console.log(`🚨🚨🚨 [SYNC_SET_RANKINGS] ===== SETTING LOCAL RANKINGS =====`);
    console.log(`🚨🚨🚨 [SYNC_NEW_COUNT] New rankings to set: ${rankings.length}`);
    
    setLocalRankings(rankings);
    
    syncInProgressRef.current = false;
    console.log(`🚨🚨🚨 [SYNC_COMPLETE] ===== SYNC COMPLETE =====`);
    return rankings;
  }, [getAllRatings, convertRatingsToRankings, pokemonLookupMap.size, allPokemon.length]);

  // CRITICAL FIX: Improved effect with better change detection
  useEffect(() => {
    if (!initializedRef.current) {
      console.log(`🚨🚨🚨 [EFFECT_INIT] ===== FIRST INITIALIZATION =====`);
      initializedRef.current = true;
    }
    
    console.log(`🚨🚨🚨 [EFFECT_ENTRY] ===== EFFECT ENTRY =====`);
    console.log(`🚨🚨🚨 [EFFECT_CONTEXT] pokemonLookupMap.size: ${pokemonLookupMap.size}`);
    console.log(`🚨🚨🚨 [EFFECT_CONTEXT] allPokemon.length: ${allPokemon.length}`);
    
    const currentRatings = getAllRatings();
    const ratingsCount = Object.keys(currentRatings).length;
    
    const isContextReady = pokemonLookupMap.size > 0 && allPokemon.length > 0;
    const ratingsChanged = ratingsCount !== lastSyncedCountRef.current;
    
    if (isContextReady && (ratingsChanged || !initializedRef.current) && !syncInProgressRef.current) {
      console.log(`🚨🚨🚨 [EFFECT_SYNC] Triggering sync - context ready and data changed`);
      syncWithTrueSkill();
    } else {
      console.log(`🚨🚨🚨 [EFFECT_NO_SYNC] No sync needed - context ready: ${isContextReady}, changes: ${ratingsChanged}, in progress: ${syncInProgressRef.current}`);
    }
  }, [pokemonLookupMap.size, allPokemon.length, getAllRatings, syncWithTrueSkill]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreUpdated = () => {
      if (!syncInProgressRef.current && pokemonLookupMap.size > 0) {
        setTimeout(() => {
          syncWithTrueSkill();
        }, 100);
      }
    };

    const handleStoreCleared = () => {
      console.log(`🚨🚨🚨 [STORE_CLEARED_EVENT] ===== STORE CLEARED - RESETTING LOCAL RANKINGS =====`);
      setLocalRankings([]);
      lastSyncedCountRef.current = 0;
    };

    document.addEventListener('trueskill-store-updated', handleStoreUpdated);
    document.addEventListener('trueskill-store-cleared', handleStoreCleared);
    document.addEventListener('trueskill-updated', handleStoreUpdated);

    return () => {
      document.removeEventListener('trueskill-store-updated', handleStoreUpdated);
      document.removeEventListener('trueskill-store-cleared', handleStoreCleared);
      document.removeEventListener('trueskill-updated', handleStoreUpdated);
    };
  }, [syncWithTrueSkill, pokemonLookupMap.size]);

  const handleManualSync = async () => {
    console.log(`🚨🚨🚨 [MANUAL_SYNC_BUTTON] ===== MANUAL SYNC BUTTON CLICKED =====`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🚨🚨🚨 [MANUAL_SYNC_DATA] TrueSkill ratings: ${ratingsCount}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_LOCAL] Current local rankings: ${localRankings.length}`);
    
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
    handleManualSync,
    clearRankingsStore
  };
};
