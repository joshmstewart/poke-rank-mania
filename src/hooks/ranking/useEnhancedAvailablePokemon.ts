
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
    // STEP 1: Verify inputs
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === INPUT VERIFICATION ===`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] localRankings length: ${localRankings?.length || 0}`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] filteredAvailablePokemon length: ${filteredAvailablePokemon?.length || 0}`);
    
    if (localRankings?.length > 0) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample localRanking:`, localRankings[0]);
    }
    
    if (filteredAvailablePokemon?.length > 0) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample filteredPokemon:`, filteredAvailablePokemon[0]);
    }
    
    // Create efficient lookup map for ranked Pokemon
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    
    if (localRankings && Array.isArray(localRankings)) {
      localRankings.forEach((pokemon, index) => {
        if (pokemon && pokemon.id) {
          rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
        }
      });
    }
    
    // STEP 2: Verify map creation
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === MAP VERIFICATION ===`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] rankedPokemonMap size: ${rankedPokemonMap.size}`);
    if (rankedPokemonMap.size > 0) {
      const firstEntry = Array.from(rankedPokemonMap.entries())[0];
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample map entry:`, firstEntry);
    }
    
    // Process each available Pokemon
    const enhanced: EnhancedPokemon[] = [];
    
    if (filteredAvailablePokemon && Array.isArray(filteredAvailablePokemon)) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === PROCESSING POKEMON ===`);
      
      filteredAvailablePokemon.forEach((pokemon, index) => {
        // STEP 3: Debug first few Pokemon in detail
        if (index < 3 || pokemon === undefined || pokemon === null) {
          console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Processing Pokemon #${index}:`, pokemon);
        }
        
        // Validate Pokemon object
        if (!pokemon || typeof pokemon.id !== 'number') {
          console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] INVALID Pokemon at index ${index}:`, pokemon);
          return; // Skip invalid Pokemon
        }
        
        const rankedInfo = rankedPokemonMap.get(pokemon.id);
        
        // STEP 4: Debug ranking lookup for first few
        if (index < 3) {
          console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Pokemon #${index} (ID: ${pokemon.id}) ranking info:`, rankedInfo);
        }
        
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
          image: pokemon.image || pokemon.spriteUrl || '',
          generation: pokemon.generation || 1
        };
        
        // STEP 5: Verify final object for first few
        if (index < 3) {
          console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Final enhanced Pokemon #${index}:`, {
            id: enhancedPokemon.id,
            name: enhancedPokemon.name,
            image: enhancedPokemon.image,
            generation: enhancedPokemon.generation,
            isRanked: enhancedPokemon.isRanked,
            currentRank: enhancedPokemon.currentRank
          });
        }
        
        // Validate final object before adding
        if (enhancedPokemon.id && enhancedPokemon.name) {
          enhanced.push(enhancedPokemon);
        } else {
          console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] MALFORMED enhanced Pokemon:`, enhancedPokemon);
        }
      });
    }
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === FINAL RESULT ===`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Enhanced Pokemon count: ${enhanced.length}`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Ranked Pokemon in enhanced: ${enhanced.filter(p => p.isRanked).length}`);
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon };
};
