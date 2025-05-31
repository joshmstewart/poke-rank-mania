
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
  
  // CRITICAL FIX: Enhanced context readiness tracking with initialization logging
  const contextReadyRef = useRef(false);
  const lastSyncedRatingsCountRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Hook execution - Map size: ${pokemonLookupMap.size}, AllPokemon length: ${allPokemon.length}`);

  // Convert TrueSkill ratings to ranked Pokemon
  const convertRatingsToRankings = useCallback((ratings: Record<number, any>): RankedPokemon[] => {
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ===== CONVERSION START =====`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Input ratings count: ${Object.keys(ratings).length}`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Context map size: ${pokemonLookupMap.size}`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Ratings object keys:`, Object.keys(ratings));
    
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
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Pokemon IDs with ratings: ${ratedPokemonIds.join(', ')}`);

    const rankedPokemon: RankedPokemon[] = [];
    let foundCount = 0;
    let missingCount = 0;

    ratedPokemonIds.forEach(pokemonId => {
      const pokemon = pokemonLookupMap.get(pokemonId);
      const rating = ratings[pokemonId];
      
      console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Processing Pokemon ${pokemonId}: pokemon=${!!pokemon}, rating=${!!rating}`);
      
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
        
        console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ✅ Added Pokemon ${pokemonId} (${pokemon.name}) with score ${score.toFixed(2)}`);
      } else {
        missingCount++;
        console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ❌ Missing data for Pokemon ${pokemonId} - pokemon: ${!!pokemon}, rating: ${!!rating}`);
      }
    });

    rankedPokemon.sort((a, b) => b.score - a.score);
    
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] ===== CONVERSION COMPLETE =====`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Successfully converted: ${foundCount} Pokemon`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Missing/failed: ${missingCount} Pokemon`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Final ranked Pokemon count: ${rankedPokemon.length}`);
    console.log(`🚨🚨🚨 [CONVERT_RATINGS_ULTRA_CRITICAL] Top 5 rankings:`, rankedPokemon.slice(0, 5).map(p => ({ id: p.id, name: p.name, score: p.score })));
    
    return rankedPokemon;
  }, [pokemonLookupMap]);

  // CRITICAL FIX: Enhanced sync with comprehensive state validation
  const syncWithTrueSkill = useCallback(() => {
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== SYNC TRIGGERED =====`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Context ready: ${pokemonLookupMap.size > 0}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Map size: ${pokemonLookupMap.size}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] AllPokemon length: ${allPokemon.length}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Current localRankings count: ${localRankings.length}`);
    
    const allRatings = getAllRatings();
    const ratingsCount = Object.keys(allRatings).length;
    
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== TRUESKILL STORE ANALYSIS =====`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Store ratings count: ${ratingsCount}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Last synced count: ${lastSyncedRatingsCountRef.current}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Store ratings details:`, ratingsCount > 0 ? Object.keys(allRatings).slice(0, 10).join(', ') : 'No ratings');
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Full ratings object:`, allRatings);
    
    // Only proceed if context is ready
    if (pokemonLookupMap.size === 0 || allPokemon.length === 0) {
      console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ⚠️ Context not ready - deferring sync`);
      contextReadyRef.current = false;
      return [];
    }
    
    contextReadyRef.current = true;
    lastSyncedRatingsCountRef.current = ratingsCount;
    
    const rankings = convertRatingsToRankings(allRatings);
    
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== SETTING LOCAL RANKINGS =====`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Previous localRankings: ${localRankings.length}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] New rankings to set: ${rankings.length}`);
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] THIS IS THE SINGLE SOURCE OF TRUTH FOR MANUAL MODE RANKINGS`);
    
    setLocalRankings(rankings);
    
    console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== SYNC COMPLETE =====`);
    return rankings;
  }, [getAllRatings, convertRatingsToRankings, pokemonLookupMap.size, allPokemon.length, localRankings.length]);

  // CRITICAL FIX: Enhanced effect with initialization tracking
  useEffect(() => {
    if (!initializedRef.current) {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ===== FIRST INITIALIZATION =====`);
      initializedRef.current = true;
    }
    
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ===== EFFECT ENTRY =====`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] pokemonLookupMap.size: ${pokemonLookupMap.size}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] allPokemon.length: ${allPokemon.length}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] contextReadyRef.current: ${contextReadyRef.current}`);
    
    const currentRatings = getAllRatings();
    const ratingsCount = Object.keys(currentRatings).length;
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] Current ratings count: ${ratingsCount}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] Current localRankings count: ${localRankings.length}`);
    
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    const isContextReady = pokemonLookupMap.size > 0 && allPokemon.length > 0;
    const contextJustBecameReady = isContextReady && !contextReadyRef.current;
    const ratingsChanged = ratingsCount !== lastSyncedRatingsCountRef.current;
    
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] Context ready: ${isContextReady}, just became ready: ${contextJustBecameReady}`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] Ratings changed: ${ratingsChanged} (${lastSyncedRatingsCountRef.current} -> ${ratingsCount})`);
    
    if (isContextReady && (contextJustBecameReady || ratingsChanged)) {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ✅ Triggering sync - context ready and data changed`);
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] This sync will establish the AUTHORITATIVE data source for rankings`);
      
      // Use a small timeout to ensure React has finished all updates
      syncTimeoutRef.current = setTimeout(() => {
        syncWithTrueSkill();
      }, 50);
    } else if (!isContextReady) {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ⚠️ Context not ready - waiting...`);
      contextReadyRef.current = false;
    } else {
      console.log(`🚨🚨🚨 [MANUAL_SYNC_ULTRA_ULTRA_CRITICAL] ℹ️ No sync needed - context ready but no changes`);
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
      console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Store updated event - triggering sync...`);
      if (contextReadyRef.current) {
        // Use timeout to allow other state updates to complete
        setTimeout(() => {
          syncWithTrueSkill();
        }, 100);
      } else {
        console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] Context not ready for store update - deferring`);
      }
    };

    const handleStoreCleared = () => {
      console.log(`🚨🚨🚨 [TRUESKILL_SYNC_ULTRA_CRITICAL] ===== STORE CLEARED - RESETTING LOCAL RANKINGS =====`);
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
    console.log(`🚨🚨🚨 [MANUAL_SYNC_BUTTON_ULTRA_CRITICAL] ===== MANUAL SYNC BUTTON CLICKED =====`);
    console.log(`🚨🚨🚨 [MANUAL_SYNC_BUTTON_ULTRA_CRITICAL] Context state - Map size: ${pokemonLookupMap.size}, AllPokemon: ${allPokemon.length}`);
    
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
    handleManualSync
  };
};
