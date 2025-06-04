
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
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === INPUT VERIFICATION ===`);
    
    // CRITICAL FIX: Immediate null/undefined checks before any processing
    if (!filteredAvailablePokemon || !Array.isArray(filteredAvailablePokemon)) {
      console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] filteredAvailablePokemon is invalid:`, typeof filteredAvailablePokemon);
      return [];
    }
    
    if (!localRankings || !Array.isArray(localRankings)) {
      console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] localRankings is invalid:`, typeof localRankings);
      return [];
    }
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Processing ${filteredAvailablePokemon.length} available Pokemon with ${localRankings.length} rankings`);
    
    // Create efficient lookup map for ranked Pokemon with safety
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    
    localRankings.forEach((pokemon, index) => {
      if (pokemon && typeof pokemon.id === 'number') {
        rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
      }
    });
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Created ranking map with ${rankedPokemonMap.size} entries`);

    // Process each available Pokemon with comprehensive validation
    const enhanced: EnhancedPokemon[] = [];
    
    filteredAvailablePokemon.forEach((pokemon, index) => {
      // Validate Pokemon object structure
      if (!pokemon || typeof pokemon.id !== 'number' || !pokemon.name) {
        console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] Invalid Pokemon at index ${index}:`, pokemon);
        return;
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
        generation: pokemon.generation || 1
      };
      
      enhanced.push(enhancedPokemon);
    });
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Final enhanced array: ${enhanced.length} Pokemon`);
    return enhanced;
    
  }, [filteredAvailablePokemon, localRankings]);

  return { 
    enhancedAvailablePokemon: enhancedAvailablePokemon || [] 
  };
};
