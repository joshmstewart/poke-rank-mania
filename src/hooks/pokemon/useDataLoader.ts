
import { useCallback } from "react";
import { useFormFilters } from "@/hooks/useFormFilters";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { formatPokemonName } from "@/utils/pokemon";

export const useDataLoader = (
  selectedGeneration: number,
  currentPage: number,
  loadSize: number,
  loadingType: string,
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>,
  setTotalPages: React.Dispatch<React.SetStateAction<number>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { analyzeFilteringPipeline } = useFormFilters();
  const { allPokemon } = usePokemonContext();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log(`🔍 [DATA_LOADER] Loading data for generation ${selectedGeneration}, page ${currentPage}`);
      
      // Get all Pokemon from context - this should already be filtered by generation if needed
      const availablePokemonData = allPokemon || [];
      console.log(`🔍 [DATA_LOADER] Raw available Pokemon: ${availablePokemonData.length}`);
      
      // Apply form filters with debugging
      const formFilteredPokemon = analyzeFilteringPipeline(availablePokemonData);
      console.log(`🔍 [DATA_LOADER] After form filters: ${formFilteredPokemon.length}`);
      
      // CRITICAL FIX: Apply name formatting and sort by Pokedex number
      const formattedPokemon = formFilteredPokemon
        .map(pokemon => ({
          ...pokemon,
          name: formatPokemonName(pokemon.name)
        }))
        .sort((a, b) => a.id - b.id); // Sort by Pokedex number for proper order
      
      console.log(`🔍 [DATA_LOADER] Applied name formatting and sorting to ${formattedPokemon.length} Pokemon`);
      console.log(`🔍 [DATA_LOADER] Sample formatted names:`, formattedPokemon.slice(0, 3).map(p => `${p.name} (${p.id})`));
      
      if (loadingType === "pagination") {
        const startIndex = (currentPage - 1) * loadSize;
        const endIndex = startIndex + loadSize;
        const paginatedPokemon = formattedPokemon.slice(startIndex, endIndex);
        
        console.log(`🔍 [DATA_LOADER] Pagination: showing ${startIndex}-${endIndex} of ${formattedPokemon.length}`);
        setAvailablePokemon(paginatedPokemon);
        setTotalPages(Math.ceil(formattedPokemon.length / loadSize));
      } else {
        // Load all at once
        setAvailablePokemon(formattedPokemon);
        setTotalPages(1);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType, allPokemon, analyzeFilteringPipeline, setAvailablePokemon, setRankedPokemon, setTotalPages, setIsLoading]);

  return { loadData };
};
