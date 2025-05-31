
import { useCallback, useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useRankings } from "@/hooks/battle/useRankings";
import { toast } from "@/hooks/use-toast";

export const useTrueSkillSync = () => {
  const { clearAllRatings, getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const { generateRankings } = useRankings();

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
      return;
    }

    // Generate rankings using the Battle Mode system with empty battle results
    const emptyBattleResults: any[] = [];
    const rankings = generateRankings(emptyBattleResults);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Generated ${rankings.length} rankings from Battle Mode system`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] ===== SYNC COMPLETE =====`);
    
    return rankings;
  }, [getAllRatings, pokemonLookupMap.size, generateRankings]);

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

  // CRITICAL FIX: Disable automatic TrueSkill sync events in Manual Mode
  useEffect(() => {
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] Received sync event:`, event.detail);
      
      // CRITICAL: Check if we're in manual mode by looking at the source
      if (event.detail?.source === 'manual-reorder') {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] IGNORING manual-reorder sync event to prevent auto-resorting`);
        return;
      }
      
      // Check URL to determine if we're in Manual Mode
      if (window.location.pathname === '/' || window.location.pathname.includes('manual')) {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] MANUAL MODE DETECTED - ignoring sync event to preserve manual order`);
        return;
      }
      
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_EVENT] Battle Mode sync event - proceeding with sync`);
      syncWithBattleModeRankings();
    };

    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    
    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    };
  }, [syncWithBattleModeRankings]);

  return {
    syncWithBattleModeRankings,
    handleManualSync
  };
};
