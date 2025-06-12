
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { formatPokemonName } from "@/utils/pokemon";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";

// CRITICAL FIX: This hook no longer consumes PokemonContext to break the circular dependency
export const usePokemonData = (contextPokemon: Pokemon[]) => {
  const { rankedPokemon: localRankings } = useTrueSkillSync();

  // Deterministic data processing with validation
  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    try {
      // Use the Pokemon data passed in as parameter instead of consuming context
      if (!contextPokemon || !Array.isArray(contextPokemon) || contextPokemon.length === 0) {
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
      
      // Process TrueSkill rankings
      const validRankings = (localRankings || []).filter(ranking => {
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
      console.error('Error in data processing:', error);
      return {
        availablePokemon: [],
        rankedPokemon: [],
        totalPages: 0
      };
    }
  }, [contextPokemon, localRankings]);

  return { getPokemonData };
};
