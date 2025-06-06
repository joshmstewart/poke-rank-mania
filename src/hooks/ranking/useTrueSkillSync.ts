
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

export const useTrueSkillSync = (preventAutoResorting: boolean = false) => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const lastManualOrderRef = useRef<RankedPokemon[]>([]);
  const isManualUpdateRef = useRef(false);
  
  console.log('🔄 [TRUESKILL_SYNC] Hook initialized with preventAutoResorting:', preventAutoResorting);

  // Transform TrueSkill ratings to RankedPokemon
  const rankingsFromTrueSkill = useMemo(() => {
    const syncId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] ===== GENERATING RANKINGS FROM TRUESKILL =====');
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Sync ID: ${syncId}`);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] isManualUpdateRef.current:', isManualUpdateRef.current);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] preventAutoResorting:', preventAutoResorting);
    
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
      
      // CRITICAL: Log Charmander's score calculation during sync
      if (parseInt(pokemonId) === 4) {
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] ===== CHARMANDER SYNC CALCULATION =====`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] TrueSkill Rating: μ=${rating.mu.toFixed(5)}, σ=${rating.sigma.toFixed(5)}`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Calculated Score: ${conservativeEstimate.toFixed(5)}`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Battle Count: ${rating.battleCount || 0}`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Confidence: ${confidence.toFixed(2)}%`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] isManualUpdateRef.current: ${isManualUpdateRef.current}`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] preventAutoResorting: ${preventAutoResorting}`);
      }
      
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

    // CRITICAL FIX: Only auto-sort if preventAutoResorting is false
    if (preventAutoResorting) {
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Manual mode active - NEVER auto-sorting');
      
      // ALWAYS preserve existing manual order when preventAutoResorting is true
      if (lastManualOrderRef.current.length > 0) {
        console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Preserving existing manual order, just updating scores');
        const manualOrder = lastManualOrderRef.current.map(manualPokemon => {
          const updatedPokemon = rankedPokemon.find(p => p.id === manualPokemon.id);
          if (updatedPokemon) {
            // CRITICAL: Log Charmander's score update during manual order preservation
            if (updatedPokemon.id === 4) {
              console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] ===== CHARMANDER MANUAL ORDER PRESERVATION =====`);
              console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Old score in manual order: ${manualPokemon.score.toFixed(5)}`);
              console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] New score from TrueSkill: ${updatedPokemon.score.toFixed(5)}`);
              console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Score changed: ${Math.abs(updatedPokemon.score - manualPokemon.score) > 0.001 ? 'YES' : 'NO'}`);
              console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Manual order position: ${lastManualOrderRef.current.findIndex(p => p.id === 4) + 1}`);
              console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] PRESERVING POSITION - NOT SORTING`);
            }
            
            console.log(`🔄🔄🔄 [TRUESKILL_SYNC_SCORE_UPDATE] Updated ${updatedPokemon.name} score: ${updatedPokemon.score.toFixed(3)}`);
            return updatedPokemon;
          }
          return manualPokemon;
        });
        
        // Add any new Pokemon that weren't in the manual order
        const newPokemon = rankedPokemon.filter(p => 
          !lastManualOrderRef.current.some(manual => manual.id === p.id)
        );
        
        if (newPokemon.length > 0) {
          console.log(`🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Adding ${newPokemon.length} new Pokemon to end of manual order`);
        }
        
        const finalOrder = [...manualOrder, ...newPokemon.sort((a, b) => b.score - a.score)];
        console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Final manual order preserved:', finalOrder.length, 'Pokemon');
        
        // CRITICAL: Check Charmander's final position
        const charmanderIndex = finalOrder.findIndex(p => p.id === 4);
        if (charmanderIndex !== -1) {
          console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] ===== CHARMANDER FINAL POSITION =====`);
          console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Final position: ${charmanderIndex + 1}`);
          console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Final score: ${finalOrder[charmanderIndex].score.toFixed(5)}`);
          console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] MANUAL ORDER PRESERVED - NO AUTO-SORTING`);
        }
        
        return finalOrder;
      }
      
      // First time in manual mode - sort by score but remember this order for future preservation
      const sortedByScore = rankedPokemon.sort((a, b) => b.score - a.score);
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] First time manual mode - sorted by score, will preserve future changes');
      
      // Store this as the initial manual order
      lastManualOrderRef.current = [...sortedByScore];
      
      // CRITICAL: Log Charmander's position in first-time manual mode
      const charmanderIndex = sortedByScore.findIndex(p => p.id === 4);
      if (charmanderIndex !== -1) {
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] ===== CHARMANDER FIRST TIME MANUAL MODE =====`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] First-time position: ${charmanderIndex + 1}`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] First-time score: ${sortedByScore[charmanderIndex].score.toFixed(5)}`);
        console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] STORED AS INITIAL MANUAL ORDER`);
      }
      
      return sortedByScore;
    }
    
    // Auto-sort mode - sort by score
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Auto-sort mode - sorting by score');
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Final sorted rankings:', sortedRankings.slice(0, 5).map(p => `${p.name}: ${p.score.toFixed(3)}`));
    
    // CRITICAL: Log Charmander's position in auto-sort mode
    const charmanderIndex = sortedRankings.findIndex(p => p.id === 4);
    if (charmanderIndex !== -1) {
      console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] ===== CHARMANDER AUTO-SORT POSITION =====`);
      console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Auto-sort position: ${charmanderIndex + 1}`);
      console.log(`🔥🔥🔥 [CHARMANDER_SYNC_${syncId}] Auto-sort score: ${sortedRankings[charmanderIndex].score.toFixed(5)}`);
    }
    
    return sortedRankings;
  }, [getAllRatings, pokemonLookupMap, preventAutoResorting]);

  // Update local rankings when TrueSkill data changes
  useEffect(() => {
    const effectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== TRUESKILL SYNC EFFECT TRIGGERED =====`);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] isManualUpdateRef.current: ${isManualUpdateRef.current}`);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] rankingsFromTrueSkill.length: ${rankingsFromTrueSkill.length}`);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] preventAutoResorting: ${preventAutoResorting}`);
    
    // CRITICAL FIX: Don't update if we're in manual mode and already have manual order
    if (preventAutoResorting && lastManualOrderRef.current.length > 0 && !isManualUpdateRef.current) {
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ⏸️ Skipping sync - manual mode with existing order`);
      return;
    }
    
    // Don't update if we're in the middle of a manual update
    if (isManualUpdateRef.current) {
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ⏸️ Skipping auto-update during manual operation`);
      return;
    }
    
    // CRITICAL: Check if this sync contains Charmander and log its details
    const charmander = rankingsFromTrueSkill.find(p => p.id === 4);
    if (charmander) {
      const charmanderIndex = rankingsFromTrueSkill.findIndex(p => p.id === 4);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== CHARMANDER IN SYNC =====`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EFFECT_${effectId}] Charmander position: ${charmanderIndex + 1}`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EFFECT_${effectId}] Charmander score: ${charmander.score.toFixed(5)}`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EFFECT_${effectId}] Charmander rating: μ=${charmander.rating.mu.toFixed(5)}, σ=${charmander.rating.sigma.toFixed(5)}`);
    }
    
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ✅ Updating local rankings - Rankings from TrueSkill updated: ${rankingsFromTrueSkill.length}`);
    setLocalRankings(rankingsFromTrueSkill);
    
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== SYNC EFFECT COMPLETE =====`);
  }, [rankingsFromTrueSkill, preventAutoResorting]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    const updateId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== MANUAL RANKINGS UPDATE =====`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Manual rankings update received: ${newRankings.length}`);
    
    // CRITICAL: Log Charmander's details in the update
    const charmander = newRankings.find(p => p.id === 4);
    if (charmander) {
      const charmanderIndex = newRankings.findIndex(p => p.id === 4);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== CHARMANDER IN UPDATE =====`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Charmander position: ${charmanderIndex + 1}`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Charmander score: ${charmander.score.toFixed(5)}`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Charmander rating: μ=${charmander.rating.mu.toFixed(5)}, σ=${charmander.rating.sigma.toFixed(5)}`);
    }
    
    // Set the manual update flag to prevent auto-updates
    isManualUpdateRef.current = true;
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ⏸️ Manual update flag SET`);
    
    // CRITICAL FIX: Always store the manual order when preventAutoResorting is true
    if (preventAutoResorting) {
      lastManualOrderRef.current = [...newRankings];
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] STORED manual order in ref - first 3:`, 
        newRankings.slice(0, 3).map((p, i) => `${i+1}. ${p.name}: ${p.score.toFixed(3)}`));
      
      // CRITICAL: Log Charmander's position in stored manual order
      const charmanderIndex = newRankings.findIndex(p => p.id === 4);
      if (charmanderIndex !== -1) {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== CHARMANDER STORED IN MANUAL ORDER =====`);
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Stored position: ${charmanderIndex + 1}`);
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] Stored score: ${newRankings[charmanderIndex].score.toFixed(5)}`);
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] THIS ORDER WILL BE PRESERVED IN FUTURE SYNCS`);
      }
    }
    
    setLocalRankings(newRankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_UPDATE_${updateId}] ✅ Local rankings updated`);
    
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
