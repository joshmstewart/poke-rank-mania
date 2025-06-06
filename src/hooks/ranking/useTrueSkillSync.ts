
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

export const useTrueSkillSync = (preventAutoResorting: boolean = false) => {
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
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Retrieved ratings from store:', Object.keys(ratings).length);
    
    const rankedPokemon: RankedPokemon[] = [];
    
    Object.entries(ratings).forEach(([pokemonId, rating]) => {
      const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
      if (!pokemon) {
        console.warn('🔄 [TRUESKILL_SYNC] Pokemon not found in lookup map:', pokemonId);
        return;
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
    });

    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Created', rankedPokemon.length, 'ranked Pokemon');

    // ALWAYS sort by score (highest first) - no manual order preservation
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Always sorting by score - top 5:', 
      sortedRankings.slice(0, 5).map(p => `${p.name}: ${p.score.toFixed(3)}`));
    
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
    
    // ALWAYS sort by score before setting
    const sortedRankings = [...newRankings].sort((a, b) => b.score - a.score);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Sorted rankings by score - top 3:`, 
      sortedRankings.slice(0, 3).map((p, i) => `${i+1}. ${p.name}: ${p.score.toFixed(3)}`));
    
    setLocalRankings(sortedRankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ✅ Local rankings updated and sorted`);
    
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
