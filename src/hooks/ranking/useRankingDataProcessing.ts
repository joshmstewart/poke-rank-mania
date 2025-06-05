
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
  
  console.log(`🔮 [RANKING_DATA_PROCESSING] Processing with ${trueskillRankings.length} TrueSkill rankings`);
  
  // Ensure all inputs are safe arrays
  const safeAvailablePokemon = useMemo(() => {
    const result = Array.isArray(availablePokemon) ? availablePokemon : [];
    console.log(`🔮 [RANKING_DATA_PROCESSING] safeAvailablePokemon: ${result.length}`);
    return result;
  }, [availablePokemon]);
  
  const safeRankedPokemon = useMemo(() => {
    const result = Array.isArray(rankedPokemon) ? rankedPokemon : [];
    console.log(`🔮 [RANKING_DATA_PROCESSING] safeRankedPokemon: ${result.length}`);
    return result;
  }, [rankedPokemon]);
  
  const localRankings = useMemo(() => {
    console.log(`🔮 [RANKING_DATA_PROCESSING] Selecting rankings - TrueSkill: ${trueskillRankings.length}, Manual: ${safeRankedPokemon.length}`);
    
    if (trueskillRankings.length > 0) {
      console.log(`🔮 [RANKING_DATA_PROCESSING] Using TrueSkill rankings: ${trueskillRankings.length}`);
      return trueskillRankings;
    }
    
    if (safeRankedPokemon.length > 0) {
      console.log(`🔮 [RANKING_DATA_PROCESSING] Using manual rankings: ${safeRankedPokemon.length}`);
      return safeRankedPokemon;
    }
    
    console.log(`🔮 [RANKING_DATA_PROCESSING] No rankings available, returning empty array`);
    return [];
  }, [trueskillRankings, safeRankedPokemon]);

  // Apply generation filtering with guaranteed safe array
  const { filteredAvailablePokemon } = useGenerationFilter(safeAvailablePokemon, selectedGeneration);

  const safeFilteredAvailablePokemon = useMemo(() => {
    const result = Array.isArray(filteredAvailablePokemon) ? filteredAvailablePokemon : [];
    console.log(`🔮 [RANKING_DATA_PROCESSING] safeFilteredAvailablePokemon: ${result.length}`);
    return result;
  }, [filteredAvailablePokemon]);

  // Enhanced available Pokemon with guaranteed safe inputs
  const { enhancedAvailablePokemon } = useEnhancedAvailablePokemon({
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    localRankings
  });

  console.log(`🔮 [RANKING_DATA_PROCESSING] FINAL - localRankings: ${localRankings.length}, enhancedAvailablePokemon: ${enhancedAvailablePokemon?.length || 0}`);

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    enhancedAvailablePokemon: enhancedAvailablePokemon || []
  };
};
