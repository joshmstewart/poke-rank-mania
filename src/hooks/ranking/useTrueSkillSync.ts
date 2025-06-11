
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

export const useTrueSkillSync = () => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const isManualUpdateRef = useRef(false);
  
  console.log('🔄 [TRUESKILL_SYNC] Hook initialized');

  // Transform TrueSkill ratings to RankedPokemon - ALWAYS SORT BY SCORE
  const rankingsFromTrueSkill = useMemo(() => {
    const syncId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] ===== GENERATING RANKINGS FROM TRUESKILL =====');
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Sync ID: ${syncId}`);
    
    const ratings = getAllRatings();
    const rawRatingIds = Object.keys(ratings);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Retrieved ratings from store:', Object.keys(ratings).length);
    
    // DETAILED AUDIT LOGGING
    const auditId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== STARTING RANKING FILTER AUDIT =====`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 1 - Raw ratings from TrueSkill store: ${rawRatingIds.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Raw rating IDs sample:`, rawRatingIds.slice(0, 10).join(', '));
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 2 - Pokemon lookup map size: ${pokemonLookupMap.size}`);
    
    // Track lookup failures
    const lookupFailures: string[] = [];
    const battleCountFilteredOut: string[] = [];
    const successfullyProcessed: string[] = [];
    
    const rankedPokemon: RankedPokemon[] = [];
    
    Object.entries(ratings).forEach(([pokemonId, rating]) => {
      const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
      if (!pokemon) {
        lookupFailures.push(pokemonId);
        console.warn('🔄 [TRUESKILL_SYNC] Pokemon not found in lookup map:', pokemonId);
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
      
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_SCORE_CALC] ${pokemon.name}: μ=${rating.mu.toFixed(3)}, σ=${rating.sigma.toFixed(3)}, score=${conservativeEstimate.toFixed(3)}`);
      
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
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== FILTER AUDIT RESULTS =====`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 3 - Lookup failures: ${lookupFailures.length}`);
    if (lookupFailures.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Failed lookup IDs:`, lookupFailures.slice(0, 10).join(', '), lookupFailures.length > 10 ? `... and ${lookupFailures.length - 10} more` : '');
    }
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 4 - Zero battle count: ${battleCountFilteredOut.length}`);
    if (battleCountFilteredOut.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Zero battle IDs:`, battleCountFilteredOut.slice(0, 10).join(', '), battleCountFilteredOut.length > 10 ? `... and ${battleCountFilteredOut.length - 10} more` : '');
    }
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] STEP 5 - Successfully processed: ${successfullyProcessed.length}`);
    
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Created', rankedPokemon.length, 'ranked Pokemon');

    // ALWAYS SORT BY SCORE - HIGHEST TO LOWEST
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] ALWAYS sorting by score - highest to lowest');
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Top 3 scores:', sortedRankings.slice(0, 3).map(p => `${p.name}: ${p.score.toFixed(3)}`));
    
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== AUDIT SUMMARY =====`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Started with: ${rawRatingIds.length} raw ratings`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Lost to lookup failures: ${lookupFailures.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Zero battle count (kept): ${battleCountFilteredOut.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Final display count: ${sortedRankings.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] Total lost: ${rawRatingIds.length - sortedRankings.length}`);
    console.log(`🔍🔍🔍 [RANKING_FILTER_AUDIT_${auditId}] ===== END AUDIT =====`);
    
    return sortedRankings;
  }, [getAllRatings, pokemonLookupMap]);

  // Update local rankings when TrueSkill data changes
  useEffect(() => {
    const effectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== TRUESKILL SYNC EFFECT TRIGGERED =====`);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] isManualUpdateRef.current: ${isManualUpdateRef.current}`);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] rankingsFromTrueSkill.length: ${rankingsFromTrueSkill.length}`);
    
    // Don't update if we're in the middle of a manual update
    if (isManualUpdateRef.current) {
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ⏸️ Skipping auto-update during manual operation`);
      return;
    }
    
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ✅ Updating local rankings - Rankings from TrueSkill updated: ${rankingsFromTrueSkill.length}`);
    setLocalRankings(rankingsFromTrueSkill);
    
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== SYNC EFFECT COMPLETE =====`);
  }, [rankingsFromTrueSkill]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    const updateId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== MANUAL RANKINGS UPDATE =====`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Manual rankings update received: ${newRankings.length}`);
    
    // Set the manual update flag to prevent auto-updates
    isManualUpdateRef.current = true;
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ⏸️ Manual update flag SET`);
    
    // ALWAYS SORT BY SCORE AFTER MANUAL UPDATES TOO
    const sortedRankings = [...newRankings].sort((a, b) => b.score - a.score);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ALWAYS sorting after manual update`);
    
    setLocalRankings(sortedRankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ✅ Local rankings updated with sorted order`);
    
    // Clear the manual update flag after a delay
    setTimeout(() => {
      isManualUpdateRef.current = false;
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ✅ Manual update flag CLEARED`);
    }, 500);
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== UPDATE COMPLETE =====`);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
