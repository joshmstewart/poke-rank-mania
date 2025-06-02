
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

interface EnhancedPokemon extends Pokemon {
  isRanked: boolean;
  currentRank: number | null;
  score: number;
  count: number;
  confidence: number;
  wins: number;
  losses: number;
  winRate: number;
  image: string;
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
        currentRank: rankedInfo?.rank || null,
        score: rankedInfo?.pokemon.score || 0,
        count: rankedInfo?.pokemon.count || 0,
        confidence: rankedInfo?.pokemon.confidence || 0,
        wins: rankedInfo?.pokemon.wins || 0,
        losses: rankedInfo?.pokemon.losses || 0,
        winRate: rankedInfo?.pokemon.winRate || 0
      };
    });
    
    return enhanced;
  }, [filteredAvailablePokemon.length, localRankings.length]);

  return { enhancedAvailablePokemon };
};
