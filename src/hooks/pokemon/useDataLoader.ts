
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
    console.log(`🚀 [DATA_LOADER_FIXED] ===== STARTING FIXED DATA LOAD =====`);
    console.log(`🚀 [DATA_LOADER_FIXED] Parameters: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    setIsLoading(true);
    
    try {
      console.log(`🚀 [DATA_LOADER_FIXED] Calling fixed getPokemonData...`);
      const result = await getPokemonData(selectedGeneration, currentPage, loadSize, loadingType);
      
      console.log(`🚀 [DATA_LOADER_FIXED] ===== FIXED DATA LOAD RESULTS =====`);
      console.log(`🚀 [DATA_LOADER_FIXED] ✅ SUCCESS - Available Pokemon: ${result.availablePokemon.length}`);
      console.log(`🚀 [DATA_LOADER_FIXED] ✅ SUCCESS - Ranked Pokemon: ${result.rankedPokemon.length}`);
      console.log(`🚀 [DATA_LOADER_FIXED] ✅ SUCCESS - Total Pages: ${result.totalPages}`);
      
      console.log(`🚀 [DATA_LOADER_FIXED] ===== UPDATING STATE (SHOULD FIX UI) =====`);
      console.log(`🚀 [DATA_LOADER_FIXED] Setting availablePokemon to: ${result.availablePokemon.length}`);
      console.log(`🚀 [DATA_LOADER_FIXED] Setting rankedPokemon to: ${result.rankedPokemon.length}`);
      
      setAvailablePokemon(result.availablePokemon);
      setRankedPokemon(result.rankedPokemon);
      setTotalPages(result.totalPages);
      
      console.log(`🚀 [DATA_LOADER_FIXED] ✅ State updated successfully - UI should now show Pokemon`);
      
    } catch (error) {
      console.error(`🚀 [DATA_LOADER_FIXED] ❌ Error loading data:`, error);
      
      // CRITICAL FIX: Only clear state if this is a genuine first load failure
      // Don't interfere with already-loaded Pokemon context data
      console.log(`🚀 [DATA_LOADER_FIXED] ⚠️ Error occurred - checking if this is initial load`);
      
      if (currentPage === 1) {
        console.log(`🚀 [DATA_LOADER_FIXED] First load failed, setting empty state`);
        setAvailablePokemon([]);
        setRankedPokemon([]);
        setTotalPages(0);
      } else {
        console.log(`🚀 [DATA_LOADER_FIXED] Subsequent page load failed, maintaining current state`);
      }
      
    } finally {
      setIsLoading(false);
      console.log(`🚀 [DATA_LOADER_FIXED] ===== FIXED DATA LOAD COMPLETE =====`);
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setAvailablePokemon, setRankedPokemon, setTotalPages, setIsLoading]);

  return { loadData };
};
