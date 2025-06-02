
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
  console.log(`🔮 [DATA_PROCESSING_ENHANCED] ===== ENHANCED DATA PROCESSING HOOK =====`);
  console.log(`🔮 [DATA_PROCESSING_ENHANCED] Input rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🔮 [DATA_PROCESSING_ENHANCED] Input availablePokemon: ${availablePokemon.length}`);
  
  const { localRankings: trueskillRankings, updateLocalRankings } = useTrueSkillSync();
  
  // Use TrueSkill rankings when available, fall back to manual rankings
  const localRankings = useMemo(() => {
    console.log(`🔮 [DATA_PROCESSING_ENHANCED] Determining ranking source...`);
    console.log(`🔮 [DATA_PROCESSING_ENHANCED] trueskillRankings.length: ${trueskillRankings.length}`);
    console.log(`🔮 [DATA_PROCESSING_ENHANCED] rankedPokemon.length: ${rankedPokemon.length}`);
    
    if (trueskillRankings.length > 0) {
      console.log(`🔮 [DATA_PROCESSING_ENHANCED] Using TrueSkill rankings: ${trueskillRankings.length} Pokemon`);
      return trueskillRankings;
    }
    
    if (rankedPokemon.length > 0) {
      console.log(`🔮 [DATA_PROCESSING_ENHANCED] Using manual rankings: ${rankedPokemon.length} Pokemon`);
      return rankedPokemon;
    }
    
    console.log(`🔮 [DATA_PROCESSING_ENHANCED] No rankings available - returning empty array`);
    return [];
  }, [trueskillRankings, rankedPokemon]);

  // Apply generation filtering to available Pokemon
  const { filteredAvailablePokemon } = useGenerationFilter(availablePokemon, selectedGeneration);

  // NEW: Enhance available Pokemon with ranking status
  const { enhancedAvailablePokemon } = useEnhancedAvailablePokemon({
    filteredAvailablePokemon,
    localRankings
  });

  console.log(`🔮 [DATA_PROCESSING_ENHANCED] Final localRankings: ${localRankings.length}`);
  console.log(`🔮 [DATA_PROCESSING_ENHANCED] Final enhancedAvailablePokemon: ${enhancedAvailablePokemon.length}`);
  console.log(`🔮 [DATA_PROCESSING_ENHANCED] Enhanced Pokemon with ranks: ${enhancedAvailablePokemon.filter(p => p.isRanked).length}`);

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon,
    enhancedAvailablePokemon // NEW: Return enhanced Pokemon list
  };
};
