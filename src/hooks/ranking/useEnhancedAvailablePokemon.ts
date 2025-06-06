
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
    console.log('🔍 [ENHANCED_AVAILABLE] ===== ENHANCING AVAILABLE POKEMON =====');
    console.log('🔍 [ENHANCED_AVAILABLE] Filtered available:', filteredAvailablePokemon.length);
    console.log('🔍 [ENHANCED_AVAILABLE] Local rankings:', localRankings.length);
    
    // Create a Set of ranked Pokemon IDs for fast lookup
    const rankedPokemonIds = new Set(localRankings.map(p => p.id));
    console.log('🔍 [ENHANCED_AVAILABLE] Ranked Pokemon IDs:', Array.from(rankedPokemonIds));
    
    const enhanced = filteredAvailablePokemon.map(pokemon => {
      const isRanked = rankedPokemonIds.has(pokemon.id);
      const currentRank = isRanked ? localRankings.findIndex(p => p.id === pokemon.id) + 1 : null;
      
      if (isRanked) {
        console.log(`🔍 [ENHANCED_AVAILABLE] ${pokemon.name} (ID: ${pokemon.id}) is ranked at position ${currentRank}`);
      }
      
      return {
        ...pokemon,
        isRanked,
        currentRank
      };
    });
    
    console.log('🔍 [ENHANCED_AVAILABLE] Enhanced available Pokemon:', enhanced.length);
    console.log('🔍 [ENHANCED_AVAILABLE] Ranked in enhanced:', enhanced.filter(p => p.isRanked).length);
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon };
};
