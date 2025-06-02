
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
    // Check context readiness
    if (pokemonLookupMap.size === 0) {
      return;
    }

    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    if (ratedPokemonIds.length === 0) {
      return;
    }

    // Only include Pokemon that have actually battled (battleCount > 0)
    const battleTestedPokemon = ratedPokemonIds.filter(pokemonId => {
      const rating = allRatings[pokemonId];
      return rating && rating.battleCount > 0;
    });

    // Generate rankings using the Battle Mode system with empty battle results
    const emptyBattleResults: any[] = [];
    const rankings = generateRankings(emptyBattleResults);
    
    // Filter rankings to only include battle-tested Pokemon
    const filteredRankings = rankings.filter(pokemon => battleTestedPokemon.includes(pokemon.id));
    
    return filteredRankings;
  }, [getAllRatings, pokemonLookupMap.size, generateRankings]);

  const handleManualSync = async () => {
    const ratings = getAllRatings();
    const battleTestedCount = Object.values(ratings).filter(r => r.battleCount > 0).length;
    
    const rankings = await syncWithBattleModeRankings();
    if (rankings && rankings.length > 0) {
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

  useEffect(() => {
    const handleSinglePokemonAdd = (event: CustomEvent) => {
      // Do nothing - let the drag logic handle the single addition
    };

    document.addEventListener('single-pokemon-added-to-rankings', handleSinglePokemonAdd as EventListener);
    
    return () => {
      document.removeEventListener('single-pokemon-added-to-rankings', handleSinglePokemonAdd as EventListener);
    };
  }, []);

  return {
    syncWithBattleModeRankings,
    handleManualSync
  };
};
