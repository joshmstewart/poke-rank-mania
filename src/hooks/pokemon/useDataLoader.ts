
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
    console.log(`🚀 [DATA_LOADER_DISABLED] ===== DATA LOADER PATH DISABLED =====`);
    console.log(`🚀 [DATA_LOADER_DISABLED] This path is now redundant since PokemonContext is the authoritative source`);
    console.log(`🚀 [DATA_LOADER_DISABLED] Parameters were: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    // Simply set loading to false and don't attempt to load data
    // The PokemonContext and usePokemonData will handle the actual data loading
    setIsLoading(false);
    
    console.log(`🚀 [DATA_LOADER_DISABLED] Setting isLoading to false, data will come from PokemonContext`);
    console.log(`🚀 [DATA_LOADER_DISABLED] ===== DATA LOADER PATH DISABLED =====`);
  }, [selectedGeneration, currentPage, loadSize, loadingType, setIsLoading]);

  return { loadData };
};
