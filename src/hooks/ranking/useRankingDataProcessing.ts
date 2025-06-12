
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
  
  // CRITICAL: Get TrueSkill data directly - this is the source of truth
  const { rankedPokemon: trueskillRankedPokemon, isLoading, totalRankings } = useTrueSkillSync();
  
  console.log(`🔮 [RANKING_DATA_PROCESSING] TrueSkill ranked Pokemon: ${trueskillRankedPokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] External ranked Pokemon: ${externalRankedPokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Available Pokemon: ${availablePokemon.length}`);
  console.log(`🔮 [RANKING_DATA_PROCESSING] Is loading: ${isLoading}`);

  // CRITICAL: ALWAYS use TrueSkill data as the primary source
  const localRankings = trueskillRankedPokemon;
  
  console.log(`🔮 [RANKING_DATA_PROCESSING] Using ${localRankings.length} Pokemon from TrueSkill as localRankings`);

  // Filter by generation if specified
  const filteredRankings = useMemo(() => {
    console.log(`🔮 [RANKING_DATA_PROCESSING] Filtering ${localRankings.length} rankings for generation ${selectedGeneration}`);
    
    if (selectedGeneration === 0) {
      console.log(`🔮 [RANKING_DATA_PROCESSING] Generation 0 selected, returning all ${localRankings.length} rankings`);
      return localRankings;
    }
    
    const filtered = localRankings.filter(pokemon => {
      // FIXED: Use generation ranges instead of checking for generation/gen properties
      const genRanges: { [key: number]: [number, number] } = {
        1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
        5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
      };
      
      const range = genRanges[selectedGeneration];
      if (!range) return false;
      
      const [min, max] = range;
      return pokemon.id >= min && pokemon.id <= max;
    });
    
    console.log(`🔮 [RANKING_DATA_PROCESSING] Filtered to ${filtered.length} Pokemon for generation ${selectedGeneration}`);
    return filtered;
  }, [localRankings, selectedGeneration]);

  console.log(`🔮 [RANKING_DATA_PROCESSING] Filtered rankings (gen ${selectedGeneration}): ${filteredRankings.length}`);

  // Display rankings (for UI display) - ALWAYS use filtered TrueSkill data
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
    console.log(`🔮 [RANKING_DATA_PROCESSING] Update rankings called with ${newRankings.length} items`);
    // Note: TrueSkill store handles the actual updates
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
