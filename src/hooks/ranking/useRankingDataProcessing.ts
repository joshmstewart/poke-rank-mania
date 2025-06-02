
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
  
  console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] ===== useRankingDataProcessing ENTRY =====`);
  console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] Input rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] Input localRankings: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] Input availablePokemon: ${availablePokemon.length}`);
  
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] ⚠️⚠️⚠️ NON-EMPTY rankedPokemon DETECTED!`);
    console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] rankedPokemon IDs: ${rankedPokemon.slice(0, 10).map(p => p.id).join(', ')}`);
    console.log(`🚨🚨🚨 [DATA_PROCESSING_ULTRA_DEBUG] rankedPokemon names: ${rankedPokemon.slice(0, 10).map(p => p.name).join(', ')}`);
  }
  
  const displayRankings = useMemo(() => {
    console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] ===== DISPLAY RANKINGS CALCULATION =====`);
    console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] localRankings.length: ${localRankings.length}`);
    console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] rankedPokemon.length: ${rankedPokemon.length}`);
    
    if (localRankings.length > 0) {
      console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] Using localRankings (${localRankings.length})`);
      return localRankings;
    }
    
    if (rankedPokemon.length > 0) {
      console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] ⚠️⚠️⚠️ USING rankedPokemon (${rankedPokemon.length})`);
      console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] This is the source of the 10 Pokemon!`);
      console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] rankedPokemon source call stack:`, new Error().stack?.split('\n').slice(1, 8).join(' | '));
      return rankedPokemon;
    }
    
    console.log(`🚨🚨🚨 [DATA_PROCESSING_DISPLAY_CALC] No rankings available - returning empty array`);
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
