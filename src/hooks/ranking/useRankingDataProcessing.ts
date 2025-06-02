
import { useState, useEffect, useMemo } from "react";
import { useTrueSkillSync } from "./useTrueSkillSync";
import { useGenerationFilter } from "@/hooks/battle/useGenerationFilter";

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
  console.log(`🔮 [DATA_PROCESSING_CRITICAL] ===== DATA PROCESSING HOOK =====`);
  console.log(`🔮 [DATA_PROCESSING_CRITICAL] Input rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🔮 [DATA_PROCESSING_CRITICAL] Input availablePokemon: ${availablePokemon.length}`);
  
  const { localRankings: trueskillRankings, updateLocalRankings } = useTrueSkillSync();
  
  // CORRECTED: Use TrueSkill rankings when available, fall back to manual rankings
  const localRankings = useMemo(() => {
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] Determining ranking source...`);
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] trueskillRankings.length: ${trueskillRankings.length}`);
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] rankedPokemon.length: ${rankedPokemon.length}`);
    
    // CORRECTED: Prefer TrueSkill rankings when available
    if (trueskillRankings.length > 0) {
      console.log(`🔮 [DATA_PROCESSING_CRITICAL] Using TrueSkill rankings: ${trueskillRankings.length} Pokemon`);
      return trueskillRankings;
    }
    
    // Fall back to manual rankings if no TrueSkill data
    if (rankedPokemon.length > 0) {
      console.log(`🔮 [DATA_PROCESSING_CRITICAL] Using manual rankings: ${rankedPokemon.length} Pokemon`);
      return rankedPokemon;
    }
    
    // Empty state - no rankings available
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] No rankings available - returning empty array`);
    return [];
  }, [trueskillRankings, rankedPokemon]);

  // Apply generation filtering to available Pokemon
  const { filteredAvailablePokemon } = useGenerationFilter(availablePokemon, selectedGeneration);

  console.log(`🔮 [DATA_PROCESSING_CRITICAL] Final localRankings: ${localRankings.length}`);
  console.log(`🔮 [DATA_PROCESSING_CRITICAL] Final filteredAvailablePokemon: ${filteredAvailablePokemon.length}`);

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon
  };
};
