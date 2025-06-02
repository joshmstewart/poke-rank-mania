
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
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] ===== STABLE PROCESSING =====`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] TrueSkill rankings: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] Available Pokemon: ${availablePokemon.length}`);
  
  // CRITICAL FIX: Use stable memoization to prevent infinite re-renders
  const displayRankings = useMemo(() => {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] Memoizing display rankings`);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] TrueSkill count: ${localRankings.length}`);
    
    if (localRankings.length > 0) {
      console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] ✅ Using ${localRankings.length} TrueSkill rankings`);
      return localRankings;
    }
    
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] ⚠️ Fallback to ${rankedPokemon.length} prop rankings`);
    return rankedPokemon;
  }, [localRankings.length, rankedPokemon.length]);

  // CRITICAL FIX: Stable memoization for filtered available Pokemon
  const filteredAvailablePokemon = useMemo(() => {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] Filtering available Pokemon`);
    
    const displayRankingsIds = new Set(displayRankings.map(p => p.id));
    
    const filtered = availablePokemon.filter(p => {
      const notAlreadyRanked = !displayRankingsIds.has(p.id);
      const passesFormFilter = shouldIncludePokemon(p);
      return notAlreadyRanked && passesFormFilter;
    });
    
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] Filtered: ${availablePokemon.length} -> ${filtered.length}`);
    return filtered;
  }, [availablePokemon.length, displayRankings.length, shouldIncludePokemon]);

  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] FINAL RESULTS:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] - Display rankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] - Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING_STABLE] ===== END STABLE PROCESSING =====`);

  return {
    localRankings: displayRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
