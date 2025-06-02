
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
  generation: number;
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
    // Create efficient lookup map for ranked Pokemon
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    
    if (localRankings && Array.isArray(localRankings)) {
      localRankings.forEach((pokemon, index) => {
        if (pokemon && pokemon.id) {
          rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
        }
      });
    }
    
    // Process each available Pokemon
    const enhanced: EnhancedPokemon[] = [];
    
    if (filteredAvailablePokemon && Array.isArray(filteredAvailablePokemon)) {
      filteredAvailablePokemon.forEach(pokemon => {
        // Validate Pokemon object
        if (!pokemon || typeof pokemon.id !== 'number') {
          return; // Skip invalid Pokemon
        }
        
        const rankedInfo = rankedPokemonMap.get(pokemon.id);
        
        // Create enhanced Pokemon with all required properties
        const enhancedPokemon: EnhancedPokemon = {
          ...pokemon,
          isRanked: !!rankedInfo,
          currentRank: rankedInfo?.rank || null,
          score: rankedInfo?.pokemon.score || 0,
          count: rankedInfo?.pokemon.count || 0,
          confidence: rankedInfo?.pokemon.confidence || 0,
          wins: rankedInfo?.pokemon.wins || 0,
          losses: rankedInfo?.pokemon.losses || 0,
          winRate: rankedInfo?.pokemon.winRate || 0,
          image: pokemon.image || '',
          generation: pokemon.generation || 1 // Use correct property name
        };
        
        enhanced.push(enhancedPokemon);
      });
    }
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon };
};
