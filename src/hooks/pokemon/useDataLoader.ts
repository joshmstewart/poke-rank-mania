
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
    console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ===== RE-ENABLING DATA LOADER FOR REGRESSION FIX =====`);
    console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] Parameters: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    setIsLoading(true);
    
    try {
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] Calling getPokemonData...`);
      const result = await getPokemonData(selectedGeneration, currentPage, loadSize, loadingType);
      
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] Result received:`, {
        availableCount: result.availablePokemon.length,
        rankedCount: result.rankedPokemon.length,
        totalPages: result.totalPages
      });
      
      // CRITICAL: Actually set the state with the received data
      setAvailablePokemon(result.availablePokemon);
      setRankedPokemon(result.rankedPokemon);
      setTotalPages(result.totalPages);
      
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ✅ State updated with available: ${result.availablePokemon.length}, ranked: ${result.rankedPokemon.length}`);
      
    } catch (error) {
      console.error(`🔄 [DATA_LOADER_ACTIVE_FIX] ❌ Error loading data:`, error);
      // Don't clear state on error, maintain current state
    } finally {
      setIsLoading(false);
    }
    
    console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ===== DATA LOADER COMPLETE =====`);
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setIsLoading, setAvailablePokemon, setRankedPokemon, setTotalPages]);

  return { loadData };
};
