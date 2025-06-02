
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

interface EnhancedPokemon extends Pokemon {
  isRanked: boolean;
  currentRank: number | null;
}

interface UseEnhancedAvailablePokemonProps {
  filteredAvailablePokemon: Pokemon[];
  localRankings: RankedPokemon[];
}

export const useEnhancedAvailablePokemon = ({
  filteredAvailablePokemon,
  localRankings
}: UseEnhancedAvailablePokemonProps) => {
  
  const enhancedAvailablePokemon = useMemo(() => {
    console.log(`🔮 [ENHANCED_AVAILABLE] Processing ${filteredAvailablePokemon.length} available Pokemon`);
    console.log(`🔮 [ENHANCED_AVAILABLE] Against ${localRankings.length} ranked Pokemon`);
    
    // Create a lookup map for ranked Pokemon for O(1) lookup
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    localRankings.forEach((pokemon, index) => {
      rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
    });
    
    const enhanced: EnhancedPokemon[] = filteredAvailablePokemon.map(pokemon => {
      const rankedInfo = rankedPokemonMap.get(pokemon.id);
      
      return {
        ...pokemon,
        isRanked: !!rankedInfo,
        currentRank: rankedInfo?.rank || null
      };
    });
    
    console.log(`🔮 [ENHANCED_AVAILABLE] Enhanced ${enhanced.length} Pokemon`);
    console.log(`🔮 [ENHANCED_AVAILABLE] Ranked Pokemon in available: ${enhanced.filter(p => p.isRanked).length}`);
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon };
};
