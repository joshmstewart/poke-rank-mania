
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
  
  // AGGRESSIVE DEBUG: Log every single input and state change
  const debugId = Date.now();
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] ===== AGGRESSIVE DEBUG =====`);
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] trueskillRankings type:`, typeof trueskillRankings);
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] trueskillRankings is array:`, Array.isArray(trueskillRankings));
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] trueskillRankings value:`, trueskillRankings);
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] trueskillRankings length:`, Array.isArray(trueskillRankings) ? trueskillRankings.length : 'NOT_ARRAY');
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] availablePokemon length:`, Array.isArray(availablePokemon) ? availablePokemon.length : 'NOT_ARRAY');
  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] rankedPokemon length:`, Array.isArray(rankedPokemon) ? rankedPokemon.length : 'NOT_ARRAY');
  
  // CRITICAL: Force array immediately if trueskillRankings is undefined/null
  const safeAvailablePokemon = useMemo(() => {
    const result = Array.isArray(availablePokemon) ? availablePokemon : [];
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] safeAvailablePokemon: ${result.length}`);
    return result;
  }, [availablePokemon]);
  
  const safeRankedPokemon = useMemo(() => {
    const result = Array.isArray(rankedPokemon) ? rankedPokemon : [];
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] safeRankedPokemon: ${result.length}`);
    return result;
  }, [rankedPokemon]);
  
  const safeTrueskillRankings = useMemo(() => {
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] safeTrueskillRankings check - input type:`, typeof trueskillRankings);
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] safeTrueskillRankings check - input is array:`, Array.isArray(trueskillRankings));
    
    if (!Array.isArray(trueskillRankings)) {
      console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] ❌❌❌ CRITICAL: trueskillRankings is NOT an array!`);
      console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] Type:`, typeof trueskillRankings);
      console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] Value:`, trueskillRankings);
      console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] Stack trace:`, new Error().stack);
      return [];
    }
    
    const result = trueskillRankings;
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] safeTrueskillRankings result: ${result.length}`);
    return result;
  }, [trueskillRankings]);
  
  const localRankings = useMemo(() => {
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] localRankings calculation - safeTrueskillRankings: ${safeTrueskillRankings.length}, safeRankedPokemon: ${safeRankedPokemon.length}`);
    
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

  const safeFilteredAvailablePokemon = useMemo(() => {
    const result = Array.isArray(filteredAvailablePokemon) ? filteredAvailablePokemon : [];
    console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] safeFilteredAvailablePokemon: ${result.length}`);
    return result;
  }, [filteredAvailablePokemon]);

  // Enhanced available Pokemon with guaranteed safe inputs
  const { enhancedAvailablePokemon } = useEnhancedAvailablePokemon({
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    localRankings
  });

  console.error(`🚨🚨🚨 [RANKING_DATA_PROCESSING_${debugId}] FINAL RETURN - localRankings: ${localRankings.length}, enhancedAvailablePokemon: ${Array.isArray(enhancedAvailablePokemon) ? enhancedAvailablePokemon.length : 'NOT_ARRAY'}`);

  return {
    localRankings,
    updateLocalRankings,
    displayRankings: localRankings,
    filteredAvailablePokemon: safeFilteredAvailablePokemon,
    enhancedAvailablePokemon: enhancedAvailablePokemon || []
  };
};
