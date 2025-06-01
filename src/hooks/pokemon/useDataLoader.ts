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
    console.log(`🚀 [DATA_LOADER] ===== STARTING DATA LOAD =====`);
    console.log(`🚀 [DATA_LOADER] Parameters: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    setIsLoading(true);
    
    try {
      console.log(`🚀 [DATA_LOADER] Calling getPokemonData...`);
      const result = await getPokemonData(selectedGeneration, currentPage, loadSize, loadingType);
      
      console.log(`🚀 [DATA_LOADER] ===== DATA LOAD RESULTS =====`);
      console.log(`🚀 [DATA_LOADER] ✅ SUCCESS - Available Pokemon: ${result.availablePokemon.length}`);
      console.log(`🚀 [DATA_LOADER] ✅ SUCCESS - Ranked Pokemon: ${result.rankedPokemon.length}`);
      console.log(`🚀 [DATA_LOADER] ✅ SUCCESS - Total Pages: ${result.totalPages}`);
      
      // CRITICAL FIX: Always update state, even if data is empty (to clear previous state)
      console.log(`🚀 [DATA_LOADER] ===== UPDATING STATE =====`);
      console.log(`🚀 [DATA_LOADER] Setting availablePokemon to: ${result.availablePokemon.length}`);
      console.log(`🚀 [DATA_LOADER] Setting rankedPokemon to: ${result.rankedPokemon.length}`);
      
      setAvailablePokemon(result.availablePokemon);
      setRankedPokemon(result.rankedPokemon);
      setTotalPages(result.totalPages);
      
      console.log(`🚀 [DATA_LOADER] ✅ State updated successfully`);
      
    } catch (error) {
      console.error(`🚀 [DATA_LOADER] ❌ Error loading data:`, error);
      
      // CRITICAL FIX: Don't leave UI in broken state on error
      // Instead, keep existing data or set to empty arrays if needed
      console.log(`🚀 [DATA_LOADER] ⚠️ Error occurred, maintaining current state`);
      
      // Only clear state if this is the first load attempt
      if (currentPage === 1) {
        console.log(`🚀 [DATA_LOADER] First load failed, clearing state`);
        setAvailablePokemon([]);
        setRankedPokemon([]);
        setTotalPages(0);
      }
      
    } finally {
      setIsLoading(false);
      console.log(`🚀 [DATA_LOADER] ===== DATA LOAD COMPLETE =====`);
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setAvailablePokemon, setRankedPokemon, setTotalPages, setIsLoading]);

  return { loadData };
};
