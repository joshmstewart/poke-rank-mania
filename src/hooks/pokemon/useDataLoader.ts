
import { useCallback } from "react";
import { usePokemonData } from "./usePokemonData";
import { LoadingType } from "./types";

export const useDataLoader = (
  selectedGeneration: number,
  currentPage: number,
  loadSize: number,
  loadingType: LoadingType,
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>,
  setTotalPages: React.Dispatch<React.SetStateAction<number>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { getPokemonData } = usePokemonData();

  const loadData = useCallback(async () => {
    console.log(`🚀 [DATA_LOADER] Starting data load for gen ${selectedGeneration}, page ${currentPage}`);
    setIsLoading(true);
    
    try {
      // CRITICAL FIX: Wait for Pokemon data to be ready
      const result = await getPokemonData(selectedGeneration, currentPage, loadSize, loadingType);
      
      console.log(`🚀 [DATA_LOADER] Data loaded successfully:`);
      console.log(`🚀 [DATA_LOADER] - Available Pokemon: ${result.availablePokemon.length}`);
      console.log(`🚀 [DATA_LOADER] - Ranked Pokemon: ${result.rankedPokemon.length}`);
      console.log(`🚀 [DATA_LOADER] - Total Pages: ${result.totalPages}`);
      
      // CRITICAL FIX: Only update state if we have valid data
      if (result.availablePokemon.length > 0 || result.rankedPokemon.length > 0) {
        setAvailablePokemon(result.availablePokemon);
        setRankedPokemon(result.rankedPokemon);
        setTotalPages(result.totalPages);
      } else {
        console.log(`🚀 [DATA_LOADER] ⚠️ No Pokemon data received, keeping existing state`);
      }
      
    } catch (error) {
      console.error(`🚀 [DATA_LOADER] ❌ Error loading data:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setAvailablePokemon, setRankedPokemon, setTotalPages, setIsLoading]);

  return { loadData };
};
