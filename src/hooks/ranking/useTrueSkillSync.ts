
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
  
  // CRITICAL FIX: Simplified context tracking to prevent sync repetition
  const contextReadyRef = useRef(false);
  const lastSyncedRatingsCountRef = useRef(0);
  const syncInProgressRef = useRef(false);
  const initializedRef = useRef(false);

  console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Hook execution - Map size: ${pokemonLookupMap.size}, AllPokemon length: ${allPokemon.length}`);

  // Convert TrueSkill ratings to ranked Pokemon
  const convertRatingsToRankings = useCallback((ratings: Record<number, any>): RankedPokemon[] => {
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ===== CONVERSION START =====`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Input ratings count: ${Object.keys(ratings).length}`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Context map size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size === 0) {
      console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ❌ Context not ready - no Pokemon data (map size: 0)`);
      return [];
    }

    const ratedPokemonIds = Object.keys(ratings).map(Number);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] No TrueSkill ratings found - returning empty rankings`);
      return [];
    }

    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Converting ${ratedPokemonIds.length} TrueSkill ratings to rankings`);

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
    
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ===== CONVERSION COMPLETE =====`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Successfully converted: ${foundCount} Pokemon`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Final ranked Pokemon count: ${rankedPokemon.length}`);
    
    return rankedPokemon;
  }, [pokemonLookupMap]);

  // CRITICAL FIX: Simplified sync with repetition prevention
  const syncWithTrueSkill = useCallback(() => {
    // Prevent multiple simultaneous syncs
    if (syncInProgressRef.current) {
      console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ⚠️ Sync already in progress - skipping`);
      return [];
    }

    syncInProgressRef.current = true;
    
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== SYNC TRIGGERED =====`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Context ready: ${pokemonLookupMap.size > 0}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Current localRankings count: ${localRankings.length}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== TRUESKILL STORE ANALYSIS =====`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Store ratings count: ${ratingsCount}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Last synced count: ${lastSyncedRatingsCountRef.current}`);
    
    // Only proceed if context is ready
    if (pokemonLookupMap.size === 0 || allPokemon.length === 0) {
      console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ⚠️ Context not ready - deferring sync`);
      contextReadyRef.current = false;
      syncInProgressRef.current = false;
      return [];
    }
    
    contextReadyRef.current = true;
    lastSyncedRatingsCountRef.current = ratingsCount;
    
    const rankings = convertRatingsToRankings(allRatings);
    
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== SETTING LOCAL RANKINGS =====`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] New rankings to set: ${rankings.length}`);
    
    setLocalRankings(rankings);
    
    syncInProgressRef.current = false;
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== SYNC COMPLETE =====`);
    return rankings;
  }, [getAllRatings, convertRatingsToRankings, pokemonLookupMap.size, allPokemon.length, localRankings.length]);

  // CRITICAL FIX: Simplified effect with better change detection
  useEffect(() => {
    if (!initializedRef.current) {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ===== FIRST INITIALIZATION =====`);
      initializedRef.current = true;
    }
    
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ===== EFFECT ENTRY =====`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] pokemonLookupMap.size: ${pokemonLookupMap.size}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] allPokemon.length: ${allPokemon.length}`);
    
    const currentRatings = getAllRatings();
    const ratingsCount = Object.keys(currentRatings).length;
    
    const isContextReady = pokemonLookupMap.size > 0 && allPokemon.length > 0;
    const contextJustBecameReady = isContextReady && !contextReadyRef.current;
    const ratingsChanged = ratingsCount !== lastSyncedRatingsCountRef.current;
    
    if (isContextReady && (contextJustBecameReady || ratingsChanged) && !syncInProgressRef.current) {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ✅ Triggering sync - context ready and data changed`);
      syncWithTrueSkill();
    } else {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ℹ️ No sync needed - context ready: ${isContextReady}, changes: ${ratingsChanged}, in progress: ${syncInProgressRef.current}`);
    }
  }, [pokemonLookupMap.size, allPokemon.length, getAllRatings, syncWithTrueSkill]);

  // CRITICAL FIX: Add store clearing function to prevent data accumulation
  const clearRankingsStore = useCallback(() => {
    console.log(`🚨🚨🚨 [STORE_CLEAR_CRITICAL] ===== CLEARING TRUESKILL STORE =====`);
    console.log(`🚨🚨🚨 [STORE_CLEAR_CRITICAL] Current store count before clear: ${Object.keys(getAllRatings()).length}`);
    clearAllRatings();
    setLocalRankings([]);
    lastSyncedRatingsCountRef.current = 0;
    contextReadyRef.current = false;
    console.log(`🚨🚨🚨 [STORE_CLEAR_CRITICAL] ✅ Store cleared - localRankings reset`);
  }, [clearAllRatings, getAllRatings]);

  // Listen for TrueSkill store changes without repetitive syncing
  useEffect(() => {
    const handleStoreUpdated = () => {
      if (contextReadyRef.current && !syncInProgressRef.current) {
        setTimeout(() => {
          syncWithTrueSkill();
        }, 100);
      }
    };

    const handleStoreCleared = () => {
      console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== STORE CLEARED - RESETTING LOCAL RANKINGS =====`);
      setLocalRankings([]);
      contextReadyRef.current = false;
      lastSyncedRatingsCountRef.current = 0;
    };

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
    console.log(`🚨🚨🚨 [MANUAL_SYNC_BUTTON_ULTRA_CRITICAL] ===== MANUAL SYNC BUTTON CLICKED =====`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🚨🚨🚨 [MANUAL_SYNC_BUTTON_ULTRA_CRITICAL] TrueSkill ratings: ${ratingsCount}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_BUTTON_ULTRA_CRITICAL] Current local rankings: ${localRankings.length}`);
    
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
