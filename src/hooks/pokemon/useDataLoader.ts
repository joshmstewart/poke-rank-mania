
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { usePokemonData } from "./usePokemonData";

export const useDataLoader = (
  selectedGeneration: number,
  currentPage: number,
  loadSize: number,
  loadingType: LoadingType,
  setAvailablePokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setRankedPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setTotalPages: React.Dispatch<React.SetStateAction<number>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { getPokemonData } = usePokemonData();

  const loadData = useCallback(async () => {
    console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] ===== LOAD DATA CALLED =====`);
    console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] selectedGeneration: ${selectedGeneration}`);
    console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] currentPage: ${currentPage}`);
    console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] loadSize: ${loadSize}`);
    console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] loadingType: ${loadingType}`);
    
    setIsLoading(true);
    
    try {
      const data = await getPokemonData(selectedGeneration, currentPage, loadSize, loadingType);
      
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] RAW DATA RECEIVED:`);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] data.availablePokemon: ${data.availablePokemon.length}`);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] data.rankedPokemon: ${data.rankedPokemon.length}`);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] data.totalPages: ${data.totalPages}`);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] TOTAL RAW: ${data.availablePokemon.length + data.rankedPokemon.length}`);
      
      // Check for unique IDs
      const availableIds = new Set(data.availablePokemon.map(p => p.id));
      const rankedIds = new Set(data.rankedPokemon.map(p => p.id));
      const totalUniqueIds = new Set([...availableIds, ...rankedIds]);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] Unique available IDs: ${availableIds.size}`);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] Unique ranked IDs: ${rankedIds.size}`);
      console.log(`🚨🚨🚨 [DATA_LOADER_INVESTIGATION] Total unique IDs: ${totalUniqueIds.size}`);
      
      setAvailablePokemon(data.availablePokemon);
      setRankedPokemon(data.rankedPokemon);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("🚨🚨🚨 [DATA_LOADER_ERROR] Failed to load Pokemon data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType, getPokemonData, setAvailablePokemon, setRankedPokemon, setTotalPages, setIsLoading]);

  return { loadData };
};
