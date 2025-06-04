
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
  
  // CRITICAL FIX: Ensure all inputs are valid arrays immediately
  const safeAvailablePokemon = useMemo(() => {
    return Array.isArray(availablePokemon) ? availablePokemon : [];
  }, [availablePokemon]);
  
  const safeRankedPokemon = useMemo(() => {
    return Array.isArray(rankedPokemon) ? rankedPokemon : [];
  }, [rankedPokemon]);
  
  const safeTrueskillRankings = useMemo(() => {
    return Array.isArray(trueskillRankings) ? trueskillRankings : [];
  }, [trueskillRankings]);
  
  console.log(`🔍 [RANKING_DATA_PROCESSING] Safe arrays - available: ${safeAvailablePokemon.length}, ranked: ${safeRankedPokemon.length}, trueskill: ${safeTrueskillRankings.length}`);
  
  // CRITICAL FIX: Use TrueSkill rankings as primary source with safe fallback
  const localRankings = useMemo(() => {
    if (safeTrueskillRankings.length > 0) {
      return safeTrueskillRankings;
    }
    
    if (safeRankedPokemon.length > 0) {
      return safeRankedPokemon;
    }
    
    return [];
  }, [safeTrueskillRankings, safeRankedPokemon]);

  // Apply generation filtering with guaranteed safe array
  const { filteredAvailablePokemon } = useGenerationFilter(safeAvailablePokemon, selectedGeneration);

  // CRITICAL FIX: Ensure filtered result is always an array
  const safeFilteredAvailablePokemon = useMemo(() => {
    return Array.isArray(filteredAvailablePokemon) ? filteredAvailablePokemon : [];
  }, [filteredAvailablePokemon]);
  
  console.log(`🔍 [RANKING_DATA_PROCESSING] Final safe filtered available: ${safeFilteredAvailablePokemon.length}`);

  // Enhanced available Pokemon with guaranteed safe inputs
  const { enhancedAvailablePokemon } = useEnhancedAvailablePokemon({
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    localRankings
  });

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    enhancedAvailablePokemon: enhancedAvailablePokemon || []
  };
};
