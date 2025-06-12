
import { useMemo } from "react";
import { useTrueSkillSync } from "./useTrueSkillSync";

interface UseRankingDataProcessingProps {
  availablePokemon: any[];
  rankedPokemon: any[];
  selectedGeneration: number;
  totalPages: number;
}

export const useRankingDataProcessing = ({
  availablePokemon,
  rankedPokemon: externalRankedPokemon,
  selectedGeneration,
  totalPages
}: UseRankingDataProcessingProps) => {
  console.log(`🔮 [RANKING_DATA_PROCESSING] ===== PROCESSING START =====`);
  
  // CRITICAL: Use TrueSkill sync to get the real ranked Pokemon data
  const { rankedPokemon: trueskillRankedPokemon, isLoading, totalRankings } = useTrueSkillSync();
  
  console.log(`🔮 [RANKING_DATA_PROCESSING] TrueSkill ranked Pokemon: ${trueskillRankedPokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] External ranked Pokemon: ${externalRankedPokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Available Pokemon: ${availablePokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Is loading: ${isLoading}`);

  // CRITICAL: Always use TrueSkill data as the source of truth
  const localRankings = trueskillRankedPokemon;

  // Filter by generation if specified
  const filteredRankings = useMemo(() => {
    if (selectedGeneration === 0) {
      return localRankings;
    }
    
    return localRankings.filter(pokemon => {
      // Generation is typically stored in the Pokemon data
      return pokemon.generation === selectedGeneration || pokemon.gen === selectedGeneration;
    });
  }, [localRankings, selectedGeneration]);

  console.log(`🔮 [RANKING_DATA_PROCESSING] Filtered rankings (gen ${selectedGeneration}): ${filteredRankings.length}`);

  // Display rankings (for UI display)
  const displayRankings = filteredRankings;

  // Filter available Pokemon to exclude already ranked ones
  const rankedPokemonIds = new Set(localRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(pokemon => !rankedPokemonIds.has(pokemon.id));

  // Enhanced available Pokemon with additional metadata
  const enhancedAvailablePokemon = useMemo(() => {
    return filteredAvailablePokemon.map(pokemon => ({
      ...pokemon,
      isRanked: false,
      canBeRanked: true
    }));
  }, [filteredAvailablePokemon]);

  const updateLocalRankings = (newRankings: any[]) => {
    // This would typically update the TrueSkill store
    console.log(`🔮 [RANKING_DATA_PROCESSING] Update rankings called with ${newRankings.length} items`);
    // For now, we don't update since TrueSkill store handles this
  };

  console.log(`🔮 [RANKING_DATA_PROCESSING] ===== FINAL RESULTS =====`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Local rankings: ${localRankings.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Display rankings: ${displayRankings.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Enhanced available: ${enhancedAvailablePokemon.length}`);

  return {
    localRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon,
    enhancedAvailablePokemon
  };
};
