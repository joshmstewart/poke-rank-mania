
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
  
  const { localRankings: trueskillRankings, updateLocalRankings } = useTrueSkillSync();
  
  // Use TrueSkill rankings when available, fall back to manual rankings
  const localRankings = useMemo(() => {
    if (trueskillRankings.length > 0) {
      return trueskillRankings;
    }
    
    if (rankedPokemon.length > 0) {
      return rankedPokemon;
    }
    
    return [];
  }, [trueskillRankings, rankedPokemon]);

  // Apply generation filtering to available Pokemon
  const { filteredAvailablePokemon } = useGenerationFilter(availablePokemon, selectedGeneration);

  // NEW: Enhance available Pokemon with ranking status
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
