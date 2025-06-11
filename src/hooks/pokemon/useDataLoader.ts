
import { useCallback } from "react";
import { usePokemonData } from "./usePokemonData";
import { LoadingType } from "./types";
import { usePokemonContext } from "@/contexts/PokemonContext";

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
  // Get Pokemon data from context to pass to usePokemonData
  const { allPokemon } = usePokemonContext();
  const { getPokemonData } = usePokemonData(allPokemon);

  const loadData = useCallback(async () => {
    console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ===== CRITICAL REGRESSION FIX =====`);
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
      
      // CRITICAL: Ensure state is properly set and logged
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] Setting availablePokemon state to: ${result.availablePokemon.length}`);
      setAvailablePokemon(result.availablePokemon);
      
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] Setting rankedPokemon state to: ${result.rankedPokemon.length}`);
      setRankedPokemon(result.rankedPokemon);
      
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] Setting totalPages to: ${result.totalPages}`);
      setTotalPages(result.totalPages);
      
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ✅ ALL STATE UPDATED - Available: ${result.availablePokemon.length}, Ranked: ${result.rankedPokemon.length}`);
      
    } catch (error) {
      console.error(`🔄 [DATA_LOADER_ACTIVE_FIX] ❌ Error loading data:`, error);
      // On error, don't clear state - keep current state to prevent regressions
      console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ⚠️ Error occurred, maintaining current state`);
    } finally {
      setIsLoading(false);
    }
    
    console.log(`🔄 [DATA_LOADER_ACTIVE_FIX] ===== DATA LOADER COMPLETE =====`);
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setIsLoading, setAvailablePokemon, setRankedPokemon, setTotalPages, allPokemon]);

  return { loadData };
};
