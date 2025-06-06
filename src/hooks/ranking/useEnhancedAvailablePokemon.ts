
import { useMemo } from "react";

interface UseEnhancedAvailablePokemonProps {
  filteredAvailablePokemon: any[];
  localRankings: any[];
}

export const useEnhancedAvailablePokemon = ({
  filteredAvailablePokemon,
  localRankings
}: UseEnhancedAvailablePokemonProps) => {
  
  const enhancedAvailablePokemon = useMemo(() => {
    // Create a Set of ranked Pokemon IDs for fast lookup
    const rankedPokemonIds = new Set(localRankings.map(p => p.id));
    
    const enhanced = filteredAvailablePokemon.map(pokemon => {
      const isRanked = rankedPokemonIds.has(pokemon.id);
      const currentRank = isRanked ? localRankings.findIndex(p => p.id === pokemon.id) + 1 : null;
      
      return {
        ...pokemon,
        isRanked,
        currentRank
      };
    });
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon };
};
