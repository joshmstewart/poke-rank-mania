
import { useCallback, useEffect, useState } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useRankings } from "@/hooks/battle/useRankings";
import { toast } from "@/hooks/use-toast";
import { RankedPokemon } from "@/services/pokemon";
import { Rating } from "ts-trueskill";

export const useTrueSkillSync = () => {
  const { clearAllRatings, getAllRatings, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const { generateRankings } = useRankings();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);
  const [manualOrderLocked, setManualOrderLocked] = useState(false);

  const syncWithBattleModeRankings = useCallback(async () => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] ===== BATTLE MODE SYNC ENTRY =====`);
    
    // Check context readiness
    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Context not ready - deferring sync`);
      return;
    }

    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] TrueSkill ratings: ${ratedPokemonIds.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Context Pokemon: ${pokemonLookupMap.size}`);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] No TrueSkill ratings - clearing rankings`);
      setLocalRankings([]);
      return;
    }

    // Generate rankings using the Battle Mode system with empty battle results
    const emptyBattleResults: any[] = [];
    const rankings = generateRankings(emptyBattleResults);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Generated ${rankings.length} rankings from Battle Mode system`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] ===== SYNC COMPLETE =====`);
    
    // Update local rankings state
    setLocalRankings(rankings);
    
    return rankings;
  }, [getAllRatings, pokemonLookupMap.size, generateRankings]);

  // Initialize local rankings from TrueSkill store on mount
  useEffect(() => {
    const initializeLocalRankings = () => {
      console.log(`🔥🔥🔥 [MANUAL_INIT] Initializing local rankings from TrueSkill store`);
      
      if (pokemonLookupMap.size === 0) {
        console.log(`🔥🔥🔥 [MANUAL_INIT] Context not ready - deferring initialization`);
        return;
      }

      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      if (ratedPokemonIds.length === 0) {
        console.log(`🔥🔥🔥 [MANUAL_INIT] No TrueSkill ratings available`);
        setLocalRankings([]);
        return;
      }

      // Convert TrueSkill ratings to ranked Pokemon
      const rankedPokemon: RankedPokemon[] = ratedPokemonIds
        .map(pokemonId => {
          const pokemon = pokemonLookupMap.get(pokemonId);
          const rating = getRating(pokemonId);
          
          if (!pokemon || !rating) {
            return null;
          }

          const conservativeEstimate = rating.mu - 3 * rating.sigma;
          const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

          return {
            ...pokemon,
            score: conservativeEstimate,
            confidence: confidence,
            rating: rating
          } as RankedPokemon;
        })
        .filter((pokemon): pokemon is RankedPokemon => pokemon !== null)
        .sort((a, b) => b.score - a.score);

      console.log(`🔥🔥🔥 [MANUAL_INIT] Initialized ${rankedPokemon.length} local rankings`);
      setLocalRankings(rankedPokemon);
    };

    initializeLocalRankings();
  }, [pokemonLookupMap, getAllRatings, getRating]);

  const handleManualSync = async () => {
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Manual sync triggered`);
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Context: ${pokemonLookupMap.size}, Ratings: ${Object.keys(getAllRatings()).length}`);
    
    const rankings = await syncWithBattleModeRankings();
    if (rankings && rankings.length > 0) {
      console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Sync successful - ${rankings.length} rankings generated`);
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${rankings.length} ranked Pokemon from Battle Mode`,
        duration: 3000
      });
    }
  };

  // CRITICAL: Custom update function for manual mode that preserves order
  const updateLocalRankings = useCallback((newRankings: RankedPokemon[]) => {
    console.log(`🔥🔥🔥 [MANUAL_UPDATE] Updating local rankings in manual mode with ${newRankings.length} Pokemon`);
    setLocalRankings(newRankings);
    setManualOrderLocked(true); // Lock the order after manual update
  }, []);

  // CRITICAL FIX: Handle insertion position for newly added Pokemon
  const handlePokemonInsertion = useCallback((pokemonId: number, insertionPosition: number, targetPokemonId: number | null) => {
    console.log(`🔥🔥🔥 [POKEMON_INSERTION] Adding Pokemon ${pokemonId} at position ${insertionPosition}`);
    
    const allRatings = getAllRatings();
    const pokemon = pokemonLookupMap.get(pokemonId);
    const rating = getRating(pokemonId);
    
    if (!pokemon || !rating) {
      console.error(`🔥🔥🔥 [POKEMON_INSERTION] ❌ Pokemon ${pokemonId} not found`);
      return;
    }

    const conservativeEstimate = rating.mu - 3 * rating.sigma;
    const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

    const newRankedPokemon: RankedPokemon = {
      ...pokemon,
      score: conservativeEstimate,
      confidence: confidence,
      rating: rating
    } as RankedPokemon;

    setLocalRankings(prevRankings => {
      const newRankings = [...prevRankings];
      
      // Insert at the specified position
      if (insertionPosition >= 0 && insertionPosition <= newRankings.length) {
        newRankings.splice(insertionPosition, 0, newRankedPokemon);
        console.log(`🔥🔥🔥 [POKEMON_INSERTION] ✅ Inserted ${pokemon.name} at position ${insertionPosition}`);
      } else {
        // Fallback to end if position is invalid
        newRankings.push(newRankedPokemon);
        console.log(`🔥🔥🔥 [POKEMON_INSERTION] ✅ Added ${pokemon.name} to end (invalid position)`);
      }
      
      return newRankings;
    });
    
    setManualOrderLocked(true); // Lock order after manual insertion
  }, [getAllRatings, pokemonLookupMap, getRating]);

  // CRITICAL: Listen for TrueSkill store updates and sync immediately
  useEffect(() => {
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] Received sync event:`, event.detail);
      
      // CRITICAL FIX: Handle ADD operations with insertion position
      if (event.detail?.action === 'add') {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] ADD operation detected with insertion data`);
        const { pokemonId, insertionPosition, targetPokemonId } = event.detail;
        
        if (typeof insertionPosition === 'number') {
          console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] Using specific insertion position: ${insertionPosition}`);
          handlePokemonInsertion(pokemonId, insertionPosition, targetPokemonId);
          return;
        }
      }
      
      // For non-add operations, respect manual lock in manual mode
      if (window.location.pathname === '/' || window.location.pathname.includes('manual')) {
        if (manualOrderLocked && event.detail?.action !== 'add') {
          console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] MANUAL MODE - ignoring non-add sync events to preserve manual order`);
          return;
        }
      }
      
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] Battle Mode sync event - proceeding with sync`);
      syncWithBattleModeRankings();
    };

    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    
    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    };
  }, [syncWithBattleModeRankings, manualOrderLocked, handlePokemonInsertion]);

  return {
    localRankings,
    syncWithBattleModeRankings,
    handleManualSync,
    updateLocalRankings,
    manualOrderLocked
  };
};
