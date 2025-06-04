
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
  
  // CRITICAL FIX: Ensure availablePokemon is always a valid array before any processing
  const safeAvailablePokemon = Array.isArray(availablePokemon) ? availablePokemon : [];
  const safeRankedPokemon = Array.isArray(rankedPokemon) ? rankedPokemon : [];
  
  console.log(`🔍 [RANKING_DATA_PROCESSING] Safe available Pokemon: ${safeAvailablePokemon.length}`);
  console.log(`🔍 [RANKING_DATA_PROCESSING] Safe ranked Pokemon: ${safeRankedPokemon.length}`);
  
  // CRITICAL FIX: Use TrueSkill rankings as the primary source, with proper fallback
  const localRankings = useMemo(() => {
    // If we have TrueSkill rankings from the 277 rated Pokemon, use them
    if (trueskillRankings && Array.isArray(trueskillRankings) && trueskillRankings.length > 0) {
      return trueskillRankings;
    }
    
    // Only fall back to manual rankings if TrueSkill is truly empty
    if (safeRankedPokemon.length > 0) {
      return safeRankedPokemon;
    }
    
    // Default to empty array
    return [];
  }, [trueskillRankings, safeRankedPokemon]);

  // Apply generation filtering to available Pokemon with safe array
  const { filteredAvailablePokemon } = useGenerationFilter(safeAvailablePokemon, selectedGeneration);

  // CRITICAL FIX: Ensure filteredAvailablePokemon is always an array before passing to enhanced hook
  const safeFilteredAvailablePokemon = Array.isArray(filteredAvailablePokemon) ? filteredAvailablePokemon : [];
  
  console.log(`🔍 [RANKING_DATA_PROCESSING] Safe filtered available Pokemon: ${safeFilteredAvailablePokemon.length}`);

  // CRITICAL FIX: Enhanced available Pokemon with proper ranking status
  const { enhancedAvailablePokemon } = useEnhancedAvailablePokemon({
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    localRankings
  });

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    enhancedAvailablePokemon
  };
};
