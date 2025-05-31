
import { useCallback, useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useRankings } from "@/hooks/battle/useRankings";
import { toast } from "@/hooks/use-toast";

export const useTrueSkillSync = () => {
  const { getAllRatings } = useTrueSkillStore();
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

    // CRITICAL FIX: Only include Pokemon that have actually battled (battleCount > 0)
    const battleTestedPokemon = ratedPokemonIds.filter(pokemonId => {
      const rating = allRatings[pokemonId];
      return rating && rating.battleCount > 0;
    });

    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Filtered to ${battleTestedPokemon.length} Pokemon with actual battles`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Battle-tested Pokemon IDs: ${battleTestedPokemon.slice(0, 10).join(', ')}${battleTestedPokemon.length > 10 ? '...' : ''}`);

    // Generate rankings using the Battle Mode system with empty battle results
    const emptyBattleResults: any[] = [];
    const rankings = generateRankings(emptyBattleResults);
    
    // Filter rankings to only include battle-tested Pokemon
    const filteredRankings = rankings.filter(pokemon => battleTestedPokemon.includes(pokemon.id));
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Generated ${filteredRankings.length} battle-tested rankings from Battle Mode system`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] ===== SYNC COMPLETE =====`);
    
    return filteredRankings;
  }, [getAllRatings, pokemonLookupMap.size, generateRankings]);

  const handleManualSync = async () => {
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Manual sync triggered`);
    const ratings = getAllRatings();
    const battleTestedCount = Object.values(ratings).filter(r => r.battleCount > 0).length;
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Context: ${pokemonLookupMap.size}, Battle-tested: ${battleTestedCount}`);
    
    const rankings = await syncWithBattleModeRankings();
    if (rankings && rankings.length > 0) {
      console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Sync successful - ${rankings.length} battle-tested rankings generated`);
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${rankings.length} battle-tested Pokemon from Battle Mode`,
        duration: 3000
      });
    } else {
      toast({
        title: "No Battle Data",
        description: "No Pokemon have been battled yet. Complete some battles first!",
        duration: 3000
      });
    }
  };

  return {
    syncWithBattleModeRankings,
    handleManualSync
  };
};
