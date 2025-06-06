
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

// Helper function to safely format Pokemon names without filtering
const safeFormatPokemonName = (name: string): string => {
  if (!name) return '';
  
  // Simple capitalization without any filtering logic
  return name.split(/(\s+|-+)/).map(part => {
    if (part.match(/^\s+$/) || part.match(/^-+$/)) {
      return part; // Keep whitespace and hyphens as-is
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
};

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
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] localRankings length: ${localRankings?.length || 0}`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] filteredAvailablePokemon length: ${filteredAvailablePokemon?.length || 0}`);
    
    // CRITICAL FIX: Debug the localRankings structure
    if (localRankings?.length > 0) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample localRanking structure:`, {
        id: localRankings[0].id,
        name: localRankings[0].name,
        score: localRankings[0].score,
        hasId: typeof localRankings[0].id === 'number',
        idValue: localRankings[0].id
      });
      
      // Check if all localRankings have valid IDs
      const invalidIds = localRankings.filter(pokemon => !pokemon || typeof pokemon.id !== 'number');
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Invalid ID count in localRankings: ${invalidIds.length}`);
      if (invalidIds.length > 0) {
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] First few invalid entries:`, invalidIds.slice(0, 3));
      }
    }
    
    if (filteredAvailablePokemon?.length > 0) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample filteredPokemon structure:`, {
        id: filteredAvailablePokemon[0].id,
        name: filteredAvailablePokemon[0].name,
        hasId: typeof filteredAvailablePokemon[0].id === 'number'
      });
    }
    
    // Create efficient lookup map for ranked Pokemon
    const rankedPokemonMap = new Map<number, { rank: number; pokemon: RankedPokemon }>();
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === MAP CREATION DEBUG ===`);
    
    if (localRankings && Array.isArray(localRankings)) {
      localRankings.forEach((pokemon, index) => {
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Processing ranking #${index}: ID=${pokemon?.id}, name="${pokemon?.name}"`);
        
        if (pokemon && typeof pokemon.id === 'number') {
          rankedPokemonMap.set(pokemon.id, { rank: index + 1, pokemon });
          console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Added to map: ${pokemon.id} -> rank ${index + 1}`);
        } else {
          console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] INVALID ranking entry at index ${index}:`, pokemon);
        }
      });
    }
    
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === MAP VERIFICATION ===`);
    console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] rankedPokemonMap size: ${rankedPokemonMap.size}`);
    if (rankedPokemonMap.size > 0) {
      const firstEntry = Array.from(rankedPokemonMap.entries())[0];
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Sample map entry:`, firstEntry);
      
      // Test lookup with first few available Pokemon
      if (filteredAvailablePokemon?.length > 0) {
        const testId = filteredAvailablePokemon[0].id;
        const lookupResult = rankedPokemonMap.get(testId);
        console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] Test lookup for ID ${testId}:`, lookupResult ? 'FOUND' : 'NOT FOUND');
      }
    }
    
    // Process each available Pokemon
    const enhanced: EnhancedPokemon[] = [];
    
    if (filteredAvailablePokemon && Array.isArray(filteredAvailablePokemon)) {
      console.log(`🔍 [ENHANCED_AVAILABLE_DEBUG] === PROCESSING POKEMON ===`);
      
      filteredAvailablePokemon.forEach((pokemon, index) => {
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
        
        // CRITICAL FIX: Apply safe name formatting here
        const formattedName = safeFormatPokemonName(pokemon.name);
        
        // Create enhanced Pokemon with all required properties
        const enhancedPokemon: EnhancedPokemon = {
          ...pokemon,
          name: formattedName, // Use safely formatted name
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
            hasValidId: typeof enhancedPokemon.id === 'number',
            nameFormatted: `"${pokemon.name}" -> "${formattedName}"`
          });
        }
        
        // Final validation before adding
        if (enhancedPokemon.id && enhancedPokemon.name && typeof enhancedPokemon.id === 'number') {
          enhanced.push(enhancedPokemon);
        } else {
          console.error(`🔍 [ENHANCED_AVAILABLE_DEBUG] MALFORMED enhanced Pokemon at index ${index}:`, enhancedPokemon);
        }
      });
    }
    
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
