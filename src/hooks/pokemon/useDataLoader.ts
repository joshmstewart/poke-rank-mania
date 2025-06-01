
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
      // CRITICAL FIX: Wait for Pokemon data to be ready
      const result = await getPokemonData(selectedGeneration, currentPage, loadSize, loadingType);
      
      console.log(`🚀 [DATA_LOADER] ===== DATA LOAD RESULTS =====`);
      console.log(`🚀 [DATA_LOADER] Available Pokemon from getPokemonData: ${result.availablePokemon.length}`);
      console.log(`🚀 [DATA_LOADER] Ranked Pokemon from getPokemonData: ${result.rankedPokemon.length}`);
      console.log(`🚀 [DATA_LOADER] Total Pages: ${result.totalPages}`);
      
      // 🚨 CRITICAL: Check if getPokemonData is returning ranked Pokemon
      if (result.rankedPokemon.length > 0) {
        console.log(`🚨🚨🚨 [DATA_LOADER_CRITICAL] getPokemonData returned ${result.rankedPokemon.length} RANKED POKEMON!`);
        console.log(`🚨🚨🚨 [DATA_LOADER_CRITICAL] This is the source! IDs: ${result.rankedPokemon.slice(0, 10).map(p => p.id).join(', ')}`);
      }
      
      // CRITICAL FIX: Only update state if we have valid data
      if (result.availablePokemon.length > 0 || result.rankedPokemon.length > 0) {
        console.log(`🚀 [DATA_LOADER] ===== UPDATING STATE =====`);
        console.log(`🚀 [DATA_LOADER] Setting availablePokemon to: ${result.availablePokemon.length}`);
        console.log(`🚀 [DATA_LOADER] Setting rankedPokemon to: ${result.rankedPokemon.length}`);
        
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
      console.log(`🚀 [DATA_LOADER] ===== DATA LOAD COMPLETE =====`);
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setAvailablePokemon, setRankedPokemon, setTotalPages, setIsLoading]);

  return { loadData };
};
