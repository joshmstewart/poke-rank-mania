
import { useState, useEffect, useMemo, useRef } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { RankedPokemon } from "@/services/pokemon";

// Helper function to safely format Pokemon names without filtering
const safeFormatPokemonName = (name: string): string => {
  if (!name) return '';
  
  // Simple capitalization without any filtering logic
  return name.split(/(\s+|-+)/).map(part => {
    if (part.match(/^\s+$/) || part.match(/^-+$/)) {
      return part; // Keep whitespace and hyphens as-is
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
};

export const useTrueSkillSync = (preventAutoResorting: boolean = false) => {
  // CRITICAL FIX: Always call hooks in the same order - declare all state first
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const lastManualOrderRef = useRef<RankedPokemon[]>([]);
  const isManualUpdateRef = useRef(false);
  
  // Always call store hooks
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  console.log('🔄 [TRUESKILL_SYNC] Hook initialized with preventAutoResorting:', preventAutoResorting);

  // Transform TrueSkill ratings to RankedPokemon - always call useMemo
  const rankingsFromTrueSkill = useMemo(() => {
    const syncId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] ===== GENERATING RANKINGS FROM TRUESKILL =====');
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Sync ID: ${syncId}`);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] pokemonLookupMap size:', pokemonLookupMap.size);
    
    // Early return if no Pokemon data available
    if (pokemonLookupMap.size === 0) {
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] No Pokemon data available yet');
      return [];
    }
    
    const ratings = getAllRatings();
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Retrieved ratings from store:', Object.keys(ratings).length);
    
    // CRITICAL FIX: Only include Pokemon that have actually been rated (battleCount > 0)
    const ratedPokemonEntries = Object.entries(ratings).filter(([pokemonId, rating]) => {
      const hasRating = rating && (rating.battleCount || 0) > 0;
      if (!hasRating) {
        console.log(`🔄🔄🔄 [TRUESKILL_SYNC_FILTER] Skipping Pokemon ${pokemonId} - no battles yet`);
      }
      return hasRating;
    });
    
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] Pokemon with battles:', ratedPokemonEntries.length);
    
    if (ratedPokemonEntries.length === 0) {
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_RANKING_GENERATION] No Pokemon have been battled yet');
      return [];
    }
    
    const rankedPokemon: RankedPokemon[] = [];
    
    ratedPokemonEntries.forEach(([pokemonId, rating]) => {
      const pokemon = pokemonLookupMap.get(parseInt(pokemonId));
      if (!pokemon) {
        console.warn('🔄 [TRUESKILL_SYNC] Pokemon not found in lookup map:', pokemonId);
        return;
      }
      
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      // CRITICAL: Apply safe name formatting here AND log it
      const originalName = pokemon.name;
      const formattedName = safeFormatPokemonName(pokemon.name);
      
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_NAME_FORMAT] ${originalName} -> ${formattedName}`);
      
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_SCORE_CALC] ${formattedName}: μ=${rating.mu.toFixed(3)}, σ=${rating.sigma.toFixed(3)}, score=${conservativeEstimate.toFixed(3)}, battles=${rating.battleCount}`);
      
      rankedPokemon.push({
        ...pokemon,
        name: formattedName, // Use formatted name
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

    // CRITICAL: Only auto-sort if preventAutoResorting is false AND we're not in a manual update
    if (preventAutoResorting) {
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Manual mode active - preserving manual order');
      
      // If we have a manual order, preserve it but update the scores
      if (lastManualOrderRef.current.length > 0 && !isManualUpdateRef.current) {
        console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Preserving existing manual order, just updating scores');
        const manualOrder = lastManualOrderRef.current.map(manualPokemon => {
          const updatedPokemon = rankedPokemon.find(p => p.id === manualPokemon.id);
          if (updatedPokemon) {
            console.log(`🔄🔄🔄 [TRUESKILL_SYNC_SCORE_UPDATE] Updated ${updatedPokemon.name} score: ${updatedPokemon.score.toFixed(3)}`);
            return updatedPokemon;
          }
          return manualPokemon;
        });
        
        // Add any new Pokemon that weren't in the manual order
        const newPokemon = rankedPokemon.filter(p => 
          !lastManualOrderRef.current.some(manual => manual.id === p.id)
        );
        
        const finalOrder = [...manualOrder, ...newPokemon.sort((a, b) => b.score - a.score)];
        console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] Final manual order preserved:', finalOrder.length, 'Pokemon');
        return finalOrder;
      }
      
      // First time in manual mode or during manual update, sort by score but remember this order
      const sortedByScore = rankedPokemon.sort((a, b) => b.score - a.score);
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_MANUAL_MODE] First time manual mode or manual update - sorted by score');
      return sortedByScore;
    }
    
    // Auto-sort mode - sort by score
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Auto-sort mode - sorting by score');
    const sortedRankings = rankedPokemon.sort((a, b) => b.score - a.score);
    console.log('🔄🔄🔄 [TRUESKILL_SYNC_AUTO_SORT] Final sorted rankings:', sortedRankings.slice(0, 5).map(p => `${p.name}: ${p.score.toFixed(3)}`));
    return sortedRankings;
  }, [getAllRatings, pokemonLookupMap, preventAutoResorting]);

  // Always call useEffect - Update local rankings when TrueSkill data changes
  useEffect(() => {
    const effectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== TRUESKILL SYNC EFFECT TRIGGERED =====`);
    console.log(`🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] isManualUpdateRef.current: ${isManualUpdateRef.current}`);
    console.log(`🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] rankingsFromTrueSkill.length: ${rankingsFromTrueSkill.length}`);
    
    // Don't update if we're in the middle of a manual update
    if (isManualUpdateRef.current) {
      console.log(`🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ⏸️ Skipping auto-update during manual operation`);
      return;
    }
    
    console.log(`🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ✅ Updating local rankings - Rankings from TrueSkill updated: ${rankingsFromTrueSkill.length}`);
    
    // CRITICAL: Apply formatting again when setting local rankings
    const formattedRankings = rankingsFromTrueSkill.map(pokemon => ({
      ...pokemon,
      name: safeFormatPokemonName(pokemon.name)
    }));
    
    setLocalRankings(formattedRankings);
    console.log(`🔄 [TRUESKILL_SYNC_EFFECT_${effectId}] ===== SYNC EFFECT COMPLETE =====`);
  }, [rankingsFromTrueSkill]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    const updateId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== MANUAL RANKINGS UPDATE =====`);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_${updateId}] Manual rankings update received: ${newRankings.length}`);
    
    // Apply safe formatting to all updated rankings
    const formattedRankings = newRankings.map(pokemon => {
      const formatted = safeFormatPokemonName(pokemon.name);
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_NAME_FORMAT] ${pokemon.name} -> ${formatted}`);
      return {
        ...pokemon,
        name: formatted
      };
    });
    
    // Set the manual update flag to prevent auto-updates
    isManualUpdateRef.current = true;
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_${updateId}] ⏸️ Manual update flag SET`);
    
    // Store the manual order for future reference
    if (preventAutoResorting) {
      lastManualOrderRef.current = [...formattedRankings];
      console.log('🔄🔄🔄 [TRUESKILL_SYNC_UPDATE] Stored manual order in ref - first 3:', 
        formattedRankings.slice(0, 3).map((p, i) => `${i+1}. ${p.name}: ${p.score.toFixed(3)}`));
    }
    
    setLocalRankings(formattedRankings);
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_${updateId}] ✅ Local rankings updated`);
    
    // Clear the manual update flag after a delay
    setTimeout(() => {
      isManualUpdateRef.current = false;
      console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_${updateId}] ✅ Manual update flag CLEARED`);
    }, 500);
    
    console.log(`🔄🔄🔄 [TRUESKILL_SYNC_UPDATE_${updateId}] ===== UPDATE COMPLETE =====`);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
