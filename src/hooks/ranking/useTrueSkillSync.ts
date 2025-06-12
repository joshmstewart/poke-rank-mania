
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

export const useTrueSkillSync = () => {
  const { getAllRatings, getRating, smartSync, isHydrated, totalBattles } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const initRef = useRef(false);

  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] ===== TRUESKILL SYNC HOOK =====`);
  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] isHydrated: ${isHydrated}`);
  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] totalBattles: ${totalBattles}`);
  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] pokemonLookupMap size: ${pokemonLookupMap.size}`);

  // CRITICAL: Get all ratings immediately when hydrated
  const allRatings = getAllRatings();
  const ratingCount = Object.keys(allRatings).length;
  
  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] Current ratings count: ${ratingCount}`);
  
  if (ratingCount > 0) {
    console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] ✅ FOUND ${ratingCount} EXISTING RATINGS!`);
    const sampleRatings = Object.entries(allRatings).slice(0, 5);
    console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] Sample ratings:`, sampleRatings.map(([id, rating]) => ({
      id,
      mu: rating.mu.toFixed(2),
      sigma: rating.sigma.toFixed(2),
      battles: rating.battleCount
    })));
  } else {
    console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] ❌ NO RATINGS FOUND - THIS IS THE PROBLEM!`);
  }

  // CRITICAL: Generate ranked Pokemon from TrueSkill data
  const rankedPokemon = useMemo(() => {
    console.log(`🔄 [TRUESKILL_SYNC_MEMO] ===== GENERATING RANKED POKEMON =====`);
    console.log(`🔄 [TRUESKILL_SYNC_MEMO] allRatings keys: ${Object.keys(allRatings).length}`);
    console.log(`🔄 [TRUESKILL_SYNC_MEMO] pokemonLookupMap size: ${pokemonLookupMap.size}`);
    
    if (Object.keys(allRatings).length === 0) {
      console.log(`🔄 [TRUESKILL_SYNC_MEMO] No ratings available, returning empty array`);
      return [];
    }

    if (pokemonLookupMap.size === 0) {
      console.log(`🔄 [TRUESKILL_SYNC_MEMO] Pokemon lookup map not ready, returning empty array`);
      return [];
    }

    const rankings: RankedPokemon[] = [];
    
    Object.entries(allRatings).forEach(([pokemonIdStr, ratingData]) => {
      const pokemonId = parseInt(pokemonIdStr);
      const basePokemon = pokemonLookupMap.get(pokemonId);
      
      if (basePokemon && ratingData) {
        // Create TrueSkill Rating object
        const rating = getRating(pokemonIdStr);
        
        // Calculate conservative estimate (mu - sigma)
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: ratingData.battleCount || 0,
          wins: 0, // These would need battle history to calculate
          losses: 0,
          winRate: 0
        };
        
        rankings.push(rankedPokemon);
      } else {
        if (!basePokemon) {
          console.warn(`🔄 [TRUESKILL_SYNC_MEMO] Pokemon ${pokemonId} not found in lookup map`);
        }
        if (!ratingData) {
          console.warn(`🔄 [TRUESKILL_SYNC_MEMO] No rating data for Pokemon ${pokemonId}`);
        }
      }
    });
    
    // Sort by score (conservative estimate)
    rankings.sort((a, b) => b.score - a.score);
    
    console.log(`🔄 [TRUESKILL_SYNC_MEMO] ✅ Generated ${rankings.length} ranked Pokemon`);
    if (rankings.length > 0) {
      console.log(`🔄 [TRUESKILL_SYNC_MEMO] Top 5:`, rankings.slice(0, 5).map(p => ({
        name: p.name,
        id: p.id,
        score: p.score.toFixed(2),
        battles: p.count
      })));
    }
    
    return rankings;
  }, [allRatings, pokemonLookupMap, getRating]);

  // Force sync on first load if we don't have data but should
  useEffect(() => {
    if (!initRef.current && isHydrated && pokemonLookupMap.size > 0) {
      initRef.current = true;
      
      console.log(`🔄 [TRUESKILL_SYNC_INIT] First load sync check`);
      console.log(`🔄 [TRUESKILL_SYNC_INIT] Current rating count: ${Object.keys(allRatings).length}`);
      
      // If we have very few ratings but expect more, force a sync
      if (Object.keys(allRatings).length < 100) {
        console.log(`🔄 [TRUESKILL_SYNC_INIT] Low rating count, forcing sync`);
        smartSync().then(() => {
          setLastSyncTime(Date.now());
          console.log(`🔄 [TRUESKILL_SYNC_INIT] Sync completed`);
        }).catch(error => {
          console.error(`🔄 [TRUESKILL_SYNC_INIT] Sync failed:`, error);
        });
      }
    }
  }, [isHydrated, pokemonLookupMap.size, allRatings, smartSync]);

  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] ===== FINAL HOOK STATE =====`);
  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] Returning ${rankedPokemon.length} ranked Pokemon`);
  console.log(`🔄 [TRUESKILL_SYNC_CRITICAL] isHydrated: ${isHydrated}`);

  return {
    rankedPokemon,
    isLoading: !isHydrated || pokemonLookupMap.size === 0,
    totalRankings: rankedPokemon.length,
    lastSyncTime,
    forceSync: () => {
      smartSync().then(() => setLastSyncTime(Date.now()));
    }
  };
};
