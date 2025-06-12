
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

export const useTrueSkillSync = () => {
  const { getAllRatings, smartSync, isHydrated } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const isManualUpdateRef = useRef(false);
  
  console.log('🚨🚨🚨 [SYNC_AUDIT] TrueSkillSync hook initialized');

  // CRITICAL: Add sync trigger when hook initializes (mode switch to ranking)
  useEffect(() => {
    console.log('🚨🚨🚨 [SYNC_AUDIT] ===== MODE SWITCH TO RANKING DETECTED =====');
    console.log('🚨🚨🚨 [SYNC_AUDIT] isHydrated:', isHydrated);
    console.log('🚨🚨🚨 [SYNC_AUDIT] pokemonLookupMap size:', pokemonLookupMap.size);
    
    if (isHydrated && pokemonLookupMap.size > 0) {
      console.log('🚨🚨🚨 [SYNC_AUDIT] Triggering smart sync for mode switch to ranking');
      smartSync();
    } else {
      console.log('🚨🚨🚨 [SYNC_AUDIT] Skipping sync - not ready (hydrated:', isHydrated, ', pokemon:', pokemonLookupMap.size, ')');
    }
  }, [isHydrated, pokemonLookupMap.size, smartSync]);

  // Transform TrueSkill ratings to RankedPokemon - ALWAYS SORT BY SCORE
  const rankingsFromTrueSkill = useMemo(() => {
    const syncId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚨🚨🚨 [SYNC_AUDIT] ===== GENERATING RANKINGS FROM TRUESKILL =====');
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Sync ID: ${syncId}`);
    
    const ratings = getAllRatings();
    const rawRatingIds = Object.keys(ratings);
    console.log('🚨🚨🚨 [SYNC_AUDIT] Retrieved ratings from store:', Object.keys(ratings).length);
    
    // DETAILED AUDIT LOGGING
    const auditId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== STARTING RANKING FILTER AUDIT =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] STEP 1 - Raw ratings from TrueSkill store: ${rawRatingIds.length}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Raw rating IDs sample:`, rawRatingIds.slice(0, 10).join(', '));
    console.log(`🚨🚨🚨 [SYNC_AUDIT] STEP 2 - Pokemon lookup map size: ${pokemonLookupMap.size}`);
    
    // Track lookup failures
    const lookupFailures: string[] = [];
    const battleCountFilteredOut: string[] = [];
    const successfullyProcessed: string[] = [];
    
    const rankedPokemon: RankedPokemon[] = [];
    
    Object.entries(ratings).forEach(([pokemonId, rating]) => {
      const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
      if (!pokemon) {
        lookupFailures.push(pokemonId);
        console.warn('🚨🚨🚨 [SYNC_AUDIT] Pokemon not found in lookup map:', pokemonId);
        return;
      }
      
      // Check battle count (implicit filter for display)
      const battleCount = rating.battleCount || 0;
      if (battleCount === 0) {
        battleCountFilteredOut.push(pokemonId);
        // Note: We're not filtering these out, just tracking them
      }
      
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ${pokemon.name}: μ=${rating.mu.toFixed(3)}, σ=${rating.sigma.toFixed(3)}, score=${conservativeEstimate.toFixed(3)}`);
      
      rankedPokemon.push({
        ...pokemon,
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating,
        count: rating.battleCount || 0,
        wins: 0,
        losses: 0,
        winRate: 0
      });
      
      successfullyProcessed.push(pokemonId);
    });

    // DETAILED AUDIT REPORTING
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== FILTER AUDIT RESULTS =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] STEP 3 - Lookup failures: ${lookupFailures.length}`);
    if (lookupFailures.length > 0) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Failed lookup IDs:`, lookupFailures.slice(0, 10).join(', '), lookupFailures.length > 10 ? `... and ${lookupFailures.length - 10} more` : '');
    }
    
    console.log(`🚨🚨🚨 [SYNC_AUDIT] STEP 4 - Zero battle count: ${battleCountFilteredOut.length}`);
    if (battleCountFilteredOut.length > 0) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Zero battle IDs:`, battleCountFilteredOut.slice(0, 10).join(', '), battleCountFilteredOut.length > 10 ? `... and ${battleCountFilteredOut.length - 10} more` : '');
    }
    
    console.log(`🚨🚨🚨 [SYNC_AUDIT] STEP 5 - Successfully processed: ${successfullyProcessed.length}`);
    
    console.log('🚨🚨🚨 [SYNC_AUDIT] Created', rankedPokemon.length, 'ranked Pokemon');

    // ALWAYS SORT BY SCORE - HIGHEST TO LOWEST
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🚨🚨🚨 [SYNC_AUDIT] ALWAYS sorting by score - highest to lowest');
    console.log('🚨🚨🚨 [SYNC_AUDIT] Top 3 scores:', sortedRankings.slice(0, 3).map(p => `${p.name}: ${p.score.toFixed(3)}`));
    
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== AUDIT SUMMARY =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Started with: ${rawRatingIds.length} raw ratings`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Lost to lookup failures: ${lookupFailures.length}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Zero battle count (kept): ${battleCountFilteredOut.length}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Final display count: ${sortedRankings.length}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Total lost: ${rawRatingIds.length - sortedRankings.length}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== END AUDIT =====`);
    
    return sortedRankings;
  }, [getAllRatings, pokemonLookupMap]);

  // Update local rankings when TrueSkill data changes
  useEffect(() => {
    const effectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== TRUESKILL SYNC EFFECT TRIGGERED =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] isManualUpdateRef.current: ${isManualUpdateRef.current}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] rankingsFromTrueSkill.length: ${rankingsFromTrueSkill.length}`);
    
    // Don't update if we're in the middle of a manual update
    if (isManualUpdateRef.current) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ⏸️ Skipping auto-update during manual operation`);
      return;
    }
    
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Updating local rankings - Rankings from TrueSkill updated: ${rankingsFromTrueSkill.length}`);
    setLocalRankings(rankingsFromTrueSkill);
    
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SYNC EFFECT COMPLETE =====`);
  }, [rankingsFromTrueSkill]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    const updateId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== MANUAL RANKINGS UPDATE =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Manual rankings update received: ${newRankings.length}`);
    
    // Set the manual update flag to prevent auto-updates
    isManualUpdateRef.current = true;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ⏸️ Manual update flag SET`);
    
    // ALWAYS SORT BY SCORE AFTER MANUAL UPDATES TOO
    const sortedRankings = [...newRankings].sort((a, b) => b.score - a.score);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ALWAYS sorting after manual update`);
    
    setLocalRankings(sortedRankings);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Local rankings updated with sorted order`);
    
    // Clear the manual update flag after a delay
    setTimeout(() => {
      isManualUpdateRef.current = false;
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ Manual update flag CLEARED`);
    }, 500);
    
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== UPDATE COMPLETE =====`);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
