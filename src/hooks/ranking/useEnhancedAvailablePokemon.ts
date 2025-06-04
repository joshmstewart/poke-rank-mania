
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
    
    // CRITICAL FIX: Multiple layers of safety checks
    const safeLocalRankings = useMemo(() => {
      if (!localRankings) {
        console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] localRankings is null/undefined`);
        return [];
      }
      if (!Array.isArray(localRankings)) {
        console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] localRankings is not array: ${typeof localRankings}`);
        return [];
      }
      return localRankings.filter(pokemon => pokemon && typeof pokemon.id === 'number');
    }, [localRankings]);
    
    const safeFilteredAvailablePokemon = useMemo(() => {
      if (!filteredAvailablePokemon) {
        console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] filteredAvailablePokemon is null/undefined`);
        return [];
      }
      if (!Array.isArray(filteredAvailablePokemon)) {
        console.warn(`🔍 [ENHANCED_AVAILABLE_DEBUG] filteredAvailablePokemon is not array: ${typeof filteredAvailablePokemon}`);
        return [];
      }
      return filteredAvailablePokemon.filter(pokemon => pokemon && typeof pokemon.id === 'number');
    }, [filteredAvailablePokemon]);
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Safe localRankings length: ${safeLocalRankings.length}`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Safe filteredAvailablePokemon length: ${safeFilteredAvailablePokemon.length}`);
    
    // Create efficient lookup map for ranked Pokemon
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === MAP CREATION DEBUG ===`);
    
    safeLocalRankings.forEach((pokemon, index) => {
      if (pokemon && typeof pokemon.id === 'number') {
        rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Added to map: ${pokemon.id} -> rank ${index + 1}`);
      } else {
        console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] INVALID ranking entry at index ${index}:`, pokemon);
      }
    });
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] rankedPokemonMap size: ${rankedPokemonMap.size}`);

    // Process each available Pokemon
    const enhanced: EnhancedPokemon[] = [];
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === PROCESSING POKEMON ===`);
    
    safeFilteredAvailablePokemon.forEach((pokemon, index) => {
      // Validate Pokemon object
      if (!pokemon || typeof pokemon.id !== 'number') {
        console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] INVALID Pokemon at index ${index}:`, pokemon);
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
        generation: pokemon.generation || 1
      };
      
      // Final validation before adding
      if (enhancedPokemon.id && enhancedPokemon.name && typeof enhancedPokemon.id === 'number') {
        enhanced.push(enhancedPokemon);
      } else {
        console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] MALFORMED enhanced Pokemon at index ${index}:`, enhancedPokemon);
      }
    });
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === FINAL RESULT ===`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Enhanced Pokemon count: ${enhanced.length}`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Ranked Pokemon in enhanced: ${enhanced.filter(p => p.isRanked).length}`);
    
    // CRITICAL: Verify no undefined objects in final array
    const undefinedCount = enhanced.filter(p => !p || typeof p.id !== 'number').length;
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Undefined/invalid objects in final array: ${undefinedCount}`);
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon: enhancedAvailablePokemon || [] };
};
