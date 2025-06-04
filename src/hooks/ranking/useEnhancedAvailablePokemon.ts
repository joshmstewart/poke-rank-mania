
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
    
    // CRITICAL FIX: Ensure both inputs are valid arrays
    const safeLocalRankings = Array.isArray(localRankings) ? localRankings : [];
    const safeFilteredAvailablePokemon = Array.isArray(filteredAvailablePokemon) ? filteredAvailablePokemon : [];
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] localRankings length: ${safeLocalRankings.length}`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] filteredAvailablePokemon length: ${safeFilteredAvailablePokemon.length}`);
    
    // CRITICAL FIX: Debug the localRankings structure
    if (safeLocalRankings.length > 0) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample localRanking structure:`, {
        id: safeLocalRankings[0].id,
        name: safeLocalRankings[0].name,
        score: safeLocalRankings[0].score,
        hasId: typeof safeLocalRankings[0].id === 'number',
        idValue: safeLocalRankings[0].id
      });
      
      // Check if all localRankings have valid IDs
      const invalidIds = safeLocalRankings.filter(pokemon => !pokemon || typeof pokemon.id !== 'number');
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Invalid ID count in localRankings: ${invalidIds.length}`);
      if (invalidIds.length > 0) {
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] First few invalid entries:`, invalidIds.slice(0, 3));
      }
    }
    
    if (safeFilteredAvailablePokemon.length > 0) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample filteredPokemon structure:`, {
        id: safeFilteredAvailablePokemon[0].id,
        name: safeFilteredAvailablePokemon[0].name,
        hasId: typeof safeFilteredAvailablePokemon[0].id === 'number'
      });
    }
    
    // Create efficient lookup map for ranked Pokemon
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === MAP CREATION DEBUG ===`);
    
    safeLocalRankings.forEach((pokemon, index) => {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Processing ranking #${index}: ID=${pokemon?.id}, name="${pokemon?.name}"`);
      
      if (pokemon && typeof pokemon.id === 'number') {
        rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Added to map: ${pokemon.id} -> rank ${index + 1}`);
      } else {
        console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] INVALID ranking entry at index ${index}:`, pokemon);
      }
    });
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === MAP VERIFICATION ===`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] rankedPokemonMap size: ${rankedPokemonMap.size}`);
    
    // Process each available Pokemon
    const enhanced: EnhancedPokemon[] = [];
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === PROCESSING POKEMON ===`);
    
    safeFilteredAvailablePokemon.forEach((pokemon, index) => {
      // Debug first few Pokemon in detail
      if (index < 3 || pokemon === undefined || pokemon === null) {
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Processing Pokemon #${index}:`, {
          id: pokemon?.id,
          name: pokemon?.name,
          hasValidId: pokemon && typeof pokemon.id === 'number'
        });
      }
      
      // Validate Pokemon object
      if (!pokemon || typeof pokemon.id !== 'number') {
        console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] INVALID Pokemon at index ${index}:`, pokemon);
        return; // Skip invalid Pokemon
      }
      
      const rankedInfo = rankedPokemonMap.get(pokemon.id);
      
      // Debug ranking lookup for first few
      if (index < 3) {
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Pokemon #${index} (ID: ${pokemon.id}) ranking lookup result:`, rankedInfo ? 'FOUND' : 'NOT FOUND');
        if (rankedInfo) {
          console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Ranking details:`, {
            rank: rankedInfo.rank,
            score: rankedInfo.pokemon.score,
            name: rankedInfo.pokemon.name
          });
        }
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
        image: pokemon.image || '',
        generation: pokemon.generation || 1
      };
      
      // Debug final object for first few
      if (index < 3) {
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Final enhanced Pokemon #${index}:`, {
          id: enhancedPokemon.id,
          name: enhancedPokemon.name,
          image: enhancedPokemon.image,
          generation: enhancedPokemon.generation,
          isRanked: enhancedPokemon.isRanked,
          currentRank: enhancedPokemon.currentRank,
          hasValidId: typeof enhancedPokemon.id === 'number'
        });
      }
      
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

  return { enhancedAvailablePokemon };
};
