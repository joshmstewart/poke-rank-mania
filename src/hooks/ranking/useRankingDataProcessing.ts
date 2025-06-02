
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
  // Get form filters to ensure available Pokemon respect filtering
  const { shouldIncludePokemon } = useFormFilters();
  
  // Get TrueSkill data with stable references
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] ===== COMPREHENSIVE PROCESSING DEBUG =====`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Input rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] TrueSkill localRankings: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Available Pokemon: ${availablePokemon.length}`);
  
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Input ranked Pokemon sample:`, rankedPokemon.slice(0, 3).map(p => `${p.name} (${p.id})`));
  }
  
  if (localRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] TrueSkill rankings sample:`, localRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
  } else {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] ❌ NO TRUESKILL RANKINGS - THIS IS WHY WE SEE 0!`);
  }
  
  // CRITICAL FIX: Use stable memoization to prevent infinite re-renders
  const displayRankings = useMemo(() => {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Memoizing display rankings`);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] TrueSkill count: ${localRankings.length}`);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Input ranked count: ${rankedPokemon.length}`);
    
    if (localRankings.length > 0) {
      console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] ✅ Using ${localRankings.length} TrueSkill rankings`);
      return localRankings;
    }
    
    if (rankedPokemon.length > 0) {
      console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] ⚠️ Fallback to ${rankedPokemon.length} prop rankings`);
      return rankedPokemon;
    }
    
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] ❌ NO RANKINGS FROM ANY SOURCE!`);
    return [];
  }, [localRankings.length, rankedPokemon.length]);

  // CRITICAL FIX: Stable memoization for filtered available Pokemon
  const filteredAvailablePokemon = useMemo(() => {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Filtering available Pokemon`);
    
    const displayRankingsIds = new Set(displayRankings.map(p => p.id));
    
    const filtered = availablePokemon.filter(p => {
      const notAlreadyRanked = !displayRankingsIds.has(p.id);
      const passesFormFilter = shouldIncludePokemon(p);
      return notAlreadyRanked && passesFormFilter;
    });
    
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] Filtered: ${availablePokemon.length} -> ${filtered.length}`);
    return filtered;
  }, [availablePokemon.length, displayRankings.length, shouldIncludePokemon]);

  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] FINAL RESULTS:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] - Display rankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] - Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_DEBUG] ===== END PROCESSING DEBUG =====`);

  return {
    localRankings: displayRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
