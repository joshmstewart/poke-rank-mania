
import { useState, useEffect, useMemo } from "react";
import { useTrueSkillSync } from "./useTrueSkillSync";
import { useGenerationFilter } from "@/hooks/battle/useGenerationFilter";
import { useEnhancedAvailablePokemon } from "./useEnhancedAvailablePokemon";

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
  
  // Always use TrueSkill sync without preventing auto-resorting
  const { localRankings: trueskillRankings, updateLocalRankings } = useTrueSkillSync();
  
  // Use TrueSkill rankings as the primary source, with proper fallback
  const localRankings = useMemo(() => {
    // If we have TrueSkill rankings from the rated Pokemon, use them
    if (trueskillRankings && trueskillRankings.length > 0) {
      return trueskillRankings;
    }
    
    // Only fall back to manual rankings if TrueSkill is truly empty
    if (rankedPokemon && rankedPokemon.length > 0) {
      return rankedPokemon;
    }
    
    // Default to empty array
    return [];
  }, [trueskillRankings, rankedPokemon]);

  // Apply generation filtering to available Pokemon
  const { filteredAvailablePokemon } = useGenerationFilter(availablePokemon, selectedGeneration);

  // Enhanced available Pokemon with proper ranking status
  const { enhancedAvailablePokemon } = useEnhancedAvailablePokemon({
    filteredAvailablePokemon,
    localRankings
  });

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon,
    enhancedAvailablePokemon
  };
};
