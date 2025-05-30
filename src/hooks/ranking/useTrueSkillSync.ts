
import { useState, useEffect, useCallback } from "react";
import { useRankings } from "@/hooks/battle/useRankings";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const useTrueSkillSync = () => {
  const { generateRankings } = useRankings();
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<any[]>([]);

  const syncTrueSkillRankings = useCallback(() => {
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔍🔍🔍 [RANKING_UI_DIRECT] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
    
    if (ratedPokemonIds.length === 0) {
      setLocalRankings([]);
      return;
    }

    // Generate rankings directly using the Battle Mode system
    const emptyBattleResults: any[] = [];
    const generatedRankings = generateRankings(emptyBattleResults);
    
    console.log(`🔍🔍🔍 [RANKING_UI_DIRECT] Generated ${generatedRankings.length} rankings directly`);
    setLocalRankings(generatedRankings);
  }, [getAllRatings, generateRankings]);

  useEffect(() => {
    // Sync immediately if we have data
    if (pokemonLookupMap.size > 0 && Object.keys(getAllRatings()).length > 0) {
      syncTrueSkillRankings();
    }

    // Also listen for TrueSkill updates
    const handleTrueSkillUpdate = () => {
      setTimeout(syncTrueSkillRankings, 100);
    };

    document.addEventListener('trueskill-updated', handleTrueSkillUpdate);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillUpdate);

    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillUpdate);
    };
  }, [getAllRatings, pokemonLookupMap.size, syncTrueSkillRankings]);

  return { localRankings };
};
