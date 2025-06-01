
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { formatPokemonName } from "@/utils/pokemon";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";

export const usePokemonData = () => {
  const { allPokemon: contextPokemon } = usePokemonContext();
  const { localRankings } = useTrueSkillSync();

  // CRITICAL FIX: Ultra-deterministic data processing with validation
  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] ===== ULTRA DETERMINISTIC DATA PROCESSING =====`);
    console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Input params - gen:${selectedGeneration}, page:${currentPage}, size:${loadSize}, type:${loadingType}`);
    console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Context Pokemon: ${contextPokemon?.length || 0}`);
    console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] TrueSkill rankings: ${localRankings?.length || 0}`);
    
    try {
      // ULTRA-CRITICAL: Validate context data exists and is array
      if (!contextPokemon || !Array.isArray(contextPokemon) || contextPokemon.length === 0) {
        console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] ❌ Invalid context data - returning empty deterministic result`);
        return {
          availablePokemon: [],
          rankedPokemon: [],
          totalPages: 0
        };
      }
      
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] ✅ Valid context data: ${contextPokemon.length} Pokemon`);
      
      // ULTRA-DETERMINISTIC: Triple-sort by ID for absolute consistency
      const tripleSort = [...contextPokemon]
        .sort((a, b) => a.id - b.id)
        .sort((a, b) => a.id - b.id)
        .sort((a, b) => a.id - b.id);
      
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Triple-sorted for ultra-determinism: ${tripleSort.length} Pokemon`);
      
      // ULTRA-DETERMINISTIC: Apply name formatting with validation
      const formattedPokemon = tripleSort.map(pokemon => {
        const formatted = {
          ...pokemon,
          name: formatPokemonName(pokemon.name)
        };
        
        // Validate formatting didn't break anything
        if (!formatted.id || !formatted.name) {
          console.error(`🔒 [ULTRA_DETERMINISTIC_DATA] ❌ Formatting corrupted Pokemon:`, pokemon);
          return pokemon; // Return original if formatting failed
        }
        
        return formatted;
      });
      
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Formatted with validation: ${formattedPokemon.length} Pokemon`);
      
      // ULTRA-DETERMINISTIC: Apply generation filtering with validation
      let filteredByGeneration = formattedPokemon;
      if (selectedGeneration > 0) {
        const genRanges: { [key: number]: [number, number] } = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        
        const range = genRanges[selectedGeneration];
        if (!range) {
          console.error(`🔒 [ULTRA_DETERMINISTIC_DATA] ❌ Invalid generation: ${selectedGeneration}`);
          return {
            availablePokemon: [],
            rankedPokemon: [],
            totalPages: 0
          };
        }
        
        const [min, max] = range;
        filteredByGeneration = formattedPokemon.filter(p => p.id >= min && p.id <= max);
        console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Generation ${selectedGeneration} filtering (${min}-${max}): ${filteredByGeneration.length} Pokemon`);
      }
      
      // ULTRA-DETERMINISTIC: Process TrueSkill rankings with validation
      const validRankings = (localRankings || []).filter(ranking => {
        const isValid = ranking && typeof ranking.id === 'number' && ranking.id > 0;
        if (!isValid) {
          console.error(`🔒 [ULTRA_DETERMINISTIC_DATA] ❌ Invalid ranking:`, ranking);
        }
        return isValid;
      });
      
      const rankedPokemonIds = new Set(validRankings.map(p => p.id));
      const sortedRankedIds = Array.from(rankedPokemonIds).sort((a, b) => a - b);
      
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Valid TrueSkill rankings: ${validRankings.length}`);
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Ranked Pokemon IDs (deterministic): ${sortedRankedIds.slice(0, 10).join(', ')}${sortedRankedIds.length > 10 ? '...' : ''}`);
      
      // ULTRA-DETERMINISTIC: Split into available and ranked with triple validation
      const availablePokemon = filteredByGeneration.filter(p => {
        const isAvailable = !rankedPokemonIds.has(p.id);
        if (!isAvailable) {
          console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Pokemon ${p.name} (${p.id}) is ranked, excluding from available`);
        }
        return isAvailable;
      });
      
      const rankedPokemon = validRankings.filter(p => {
        if (selectedGeneration === 0) return true;
        
        const genRanges: { [key: number]: [number, number] } = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        
        const range = genRanges[selectedGeneration];
        if (!range) return false;
        
        const [min, max] = range;
        const inRange = p.id >= min && p.id <= max;
        
        if (!inRange) {
          console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] Ranked Pokemon ${p.name} (${p.id}) not in gen ${selectedGeneration} range, excluding`);
        }
        
        return inRange;
      });
      
      // ULTRA-CRITICAL: Validate the split is perfect
      const totalVisible = availablePokemon.length + rankedPokemon.length;
      const expectedTotal = filteredByGeneration.length;
      
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] ULTRA-CRITICAL VALIDATION:`);
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] - Available Pokemon: ${availablePokemon.length}`);
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] - Ranked Pokemon: ${rankedPokemon.length}`);
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] - Total visible: ${totalVisible}`);
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] - Expected total: ${expectedTotal}`);
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] - Perfect split: ${totalVisible === expectedTotal ? '✅ YES' : '❌ NO'}`);
      
      if (totalVisible !== expectedTotal) {
        console.error(`🔒 [ULTRA_DETERMINISTIC_DATA] ❌ CRITICAL: Pokemon count mismatch! Expected: ${expectedTotal}, Got: ${totalVisible}, Missing: ${expectedTotal - totalVisible}`);
      }
      
      // Calculate pagination deterministically
      const totalPages = loadingType === "pagination" ? Math.ceil(availablePokemon.length / loadSize) : 1;
      
      console.log(`🔒 [ULTRA_DETERMINISTIC_DATA] ✅ ULTRA-DETERMINISTIC SUCCESS - Available: ${availablePokemon.length}, Ranked: ${rankedPokemon.length}, Pages: ${totalPages}`);
      
      return {
        availablePokemon,
        rankedPokemon,
        totalPages
      };
      
    } catch (error) {
      console.error(`🔒 [ULTRA_DETERMINISTIC_DATA] ❌ Error in ultra-deterministic processing:`, error);
      return {
        availablePokemon: [],
        rankedPokemon: [],
        totalPages: 0
      };
    }
  }, [contextPokemon, localRankings]);

  return { getPokemonData };
};
