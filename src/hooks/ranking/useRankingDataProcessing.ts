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
  
  // CRITICAL FIX: For manual ranking mode, we should NOT automatically sync from TrueSkill
  // The rankings should only come from the explicit rankedPokemon prop passed down
  const { localRankings: trueskillRankings, updateLocalRankings } = useTrueSkillSync();
  
  // CRITICAL FIX: Only use TrueSkill rankings if explicitly requested
  // For manual mode, prioritize the passed-in rankedPokemon
  const localRankings = useMemo(() => {
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] Determining ranking source...`);
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] rankedPokemon.length: ${rankedPokemon.length}`);
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] trueskillRankings.length: ${trueskillRankings.length}`);
    
    // CRITICAL DECISION: Manual mode should start empty and only show what user explicitly ranks
    // If rankedPokemon is empty, keep it empty regardless of TrueSkill data
    if (rankedPokemon.length === 0) {
      console.log(`🔮 [DATA_PROCESSING_CRITICAL] Manual mode: keeping empty rankings`);
      return [];
    }
    
    // If user has manually ranked Pokemon, use those
    console.log(`🔮 [DATA_PROCESSING_CRITICAL] Manual mode: using explicit rankings`);
    return rankedPokemon;
  }, [rankedPokemon, trueskillRankings.length]);

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
