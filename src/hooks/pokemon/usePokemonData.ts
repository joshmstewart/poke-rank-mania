
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { formatPokemonName } from "@/utils/pokemon";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";

export const usePokemonData = () => {
  const { allPokemon: contextPokemon } = usePokemonContext();
  const { localRankings } = useTrueSkillSync();

  // Deterministic data processing with validation
  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    try {
      // CRITICAL FIX: Validate context data exists and is array with comprehensive checks
      if (!contextPokemon) {
        console.warn('[POKEMON_DATA] contextPokemon is null/undefined');
        return {
          availablePokemon: [],
          rankedPokemon: [],
          totalPages: 0
        };
      }
      
      if (!Array.isArray(contextPokemon)) {
        console.warn('[POKEMON_DATA] contextPokemon is not an array:', typeof contextPokemon);
        return {
          availablePokemon: [],
          rankedPokemon: [],
          totalPages: 0
        };
      }
      
      if (contextPokemon.length === 0) {
        console.warn('[POKEMON_DATA] contextPokemon is empty array');
        return {
          availablePokemon: [],
          rankedPokemon: [],
          totalPages: 0
        };
      }
      
      // Sort by ID for consistency
      const sortedPokemon = [...contextPokemon].sort((a, b) => a.id - b.id);
      
      // Apply name formatting
      const formattedPokemon = sortedPokemon.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      
      // Apply generation filtering
      let filteredByGeneration = formattedPokemon;
      if (selectedGeneration > 0) {
        const genRanges: { [key: number]: [number, number] } = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        
        const range = genRanges[selectedGeneration];
        if (!range) {
          return {
            availablePokemon: [],
            rankedPokemon: [],
            totalPages: 0
          };
        }
        
        const [min, max] = range;
        filteredByGeneration = formattedPokemon.filter(p => p.id >= min && p.id <= max);
      }
      
      // CRITICAL FIX: Process TrueSkill rankings with comprehensive safety checks
      const safeLocalRankings = Array.isArray(localRankings) ? localRankings : [];
      const validRankings = safeLocalRankings.filter(ranking => {
        return ranking && typeof ranking.id === 'number' && ranking.id > 0;
      });
      
      const rankedPokemonIds = new Set(validRankings.map(p => p.id));
      
      // Split into available and ranked
      const availablePokemon = filteredByGeneration.filter(p => !rankedPokemonIds.has(p.id));
      
      const rankedPokemon = validRankings.filter(p => {
        if (selectedGeneration === 0) return true;
        
        const genRanges: { [key: number]: [number, number] } = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        
        const range = genRanges[selectedGeneration];
        if (!range) return false;
        
        const [min, max] = range;
        return p.id >= min && p.id <= max;
      });
      
      // Calculate pagination
      const totalPages = loadingType === "pagination" ? Math.ceil(availablePokemon.length / loadSize) : 1;
      
      return {
        availablePokemon,
        rankedPokemon,
        totalPages
      };
      
    } catch (error) {
      console.error('[POKEMON_DATA] Error in data processing:', error);
      return {
        availablePokemon: [],
        rankedPokemon: [],
        totalPages: 0
      };
    }
  }, [contextPokemon, localRankings]);

  return { getPokemonData };
};
