
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
import { useFormFilters } from "@/hooks/useFormFilters";
import { useMemo } from "react";

interface UseRankingDataProcessingProps {
  availablePokemon: any[];
  rankedPokemon: any[];
  selectedGeneration: number;
  totalPages: number;
}

export const useRankingDataProcessing = ({
  availablePokemon,
  rankedPokemon,
  selectedGeneration,
  totalPages
}: UseRankingDataProcessingProps) => {
  const { shouldIncludePokemon } = useFormFilters();
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  const displayRankings = useMemo(() => {
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] ===== DISPLAY RANKINGS CALCULATION =====`);
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] localRankings.length: ${localRankings.length}`);
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] rankedPokemon.length: ${rankedPokemon.length}`);
    
    if (localRankings.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Using localRankings (${localRankings.length})`);
      console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] First 5 local rankings: ${localRankings.slice(0, 5).map(p => `${p.name}(${p.id})`).join(', ')}`);
      return localRankings;
    }
    
    if (rankedPokemon.length > 0) {
      console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Using rankedPokemon (${rankedPokemon.length})`);
      console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] First 5 ranked Pokemon: ${rankedPokemon.slice(0, 5).map(p => `${p.name}(${p.id})`).join(', ')}`);
      return rankedPokemon;
    }
    
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] No rankings available - returning empty array`);
    return [];
  }, [localRankings.length, rankedPokemon.length]);

  const filteredAvailablePokemon = useMemo(() => {
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] ===== FILTERED AVAILABLE CALCULATION =====`);
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] availablePokemon.length: ${availablePokemon.length}`);
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] displayRankings.length: ${displayRankings.length}`);
    
    const displayRankingsIds = new Set(displayRankings.map(p => p.id));
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] displayRankingsIds size: ${displayRankingsIds.size}`);
    
    const filtered = availablePokemon.filter(p => {
      const notAlreadyRanked = !displayRankingsIds.has(p.id);
      const passesFormFilter = shouldIncludePokemon(p);
      return notAlreadyRanked && passesFormFilter;
    });
    
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Filtered available count: ${filtered.length}`);
    console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Total calculation: ${availablePokemon.length} total - ${displayRankings.length} ranked = ${filtered.length} available`);
    
    return filtered;
  }, [availablePokemon.length, displayRankings.length, shouldIncludePokemon]);

  console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] ===== FINAL RETURN VALUES =====`);
  console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Returning localRankings: ${displayRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Returning displayRankings: ${displayRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_DATA_DEBUG] Returning filteredAvailablePokemon: ${filteredAvailablePokemon.length}`);

  return {
    localRankings: displayRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
