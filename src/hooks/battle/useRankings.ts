
import { useEffect, useRef } from "react";
import { useRankingSuggestions } from "./useRankingSuggestions";
import { useRankingState } from "./useRankingState";
import { useRankingTiers } from "./useRankingTiers";
import { useRankingCalculator } from "./useRankingCalculator";

export const useRankings = () => {
  const initializationRef = useRef(false);
  const hookInstanceRef = useRef(`rankings-${Date.now()}`);
  
  // Only log INIT once per instance
  if (!initializationRef.current) {
    console.log(`[DEBUG useRankings] INIT - Instance: ${hookInstanceRef.current} - Using context for Pokemon data`);
    initializationRef.current = true;
  }
  
  // Use the extracted state hooks
  const {
    finalRankings,
    setFinalRankings,
    confidenceScores,
    setConfidenceScores,
    activeTier,
    setActiveTier
  } = useRankingState();

  const {
    frozenPokemon,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    handleSaveRankings
  } = useRankingTiers();

  const {
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions,
    activeSuggestions
  } = useRankingSuggestions(finalRankings, setFinalRankings);

  const { generateRankings } = useRankingCalculator(
    activeTier,
    frozenPokemon,
    setFinalRankings,
    setConfidenceScores,
    loadSavedSuggestions
  );

  useEffect(() => {
    if (finalRankings.length > 0) {
      // Update ref is now handled inside useRankingCalculator
    }
  }, [finalRankings]);

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon: finalRankings,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  };
};
