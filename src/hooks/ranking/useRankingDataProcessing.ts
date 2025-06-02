
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
    if (localRankings.length > 0) {
      return localRankings;
    }
    
    if (rankedPokemon.length > 0) {
      return rankedPokemon;
    }
    
    return [];
  }, [localRankings.length, rankedPokemon.length]);

  const filteredAvailablePokemon = useMemo(() => {
    const displayRankingsIds = new Set(displayRankings.map(p => p.id));
    
    const filtered = availablePokemon.filter(p => {
      const notAlreadyRanked = !displayRankingsIds.has(p.id);
      const passesFormFilter = shouldIncludePokemon(p);
      return notAlreadyRanked && passesFormFilter;
    });
    
    return filtered;
  }, [availablePokemon.length, displayRankings.length, shouldIncludePokemon]);

  return {
    localRankings: displayRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
