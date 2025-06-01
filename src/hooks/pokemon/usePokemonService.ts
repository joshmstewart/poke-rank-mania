
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

export const usePokemonService = () => {
  const { allPokemon, isLoading } = usePokemonLoader();
  
  const getAllPokemon = useCallback(async (): Promise<Pokemon[]> => {
    console.log(`🔧 [POKEMON_SERVICE] Getting all Pokemon from loader service`);
    console.log(`🔧 [POKEMON_SERVICE] Current state - isLoading: ${isLoading}, Pokemon count: ${allPokemon.length}`);
    
    // CRITICAL FIX: Wait for loading to complete instead of returning empty array
    if (isLoading) {
      console.log(`🔧 [POKEMON_SERVICE] Still loading, waiting for completion`);
      // Return a promise that resolves when loading is done
      return new Promise<Pokemon[]>((resolve) => {
        const checkLoading = () => {
          if (!isLoading && allPokemon.length > 0) {
            console.log(`🔧 [POKEMON_SERVICE] Loading completed, returning ${allPokemon.length} Pokemon`);
            resolve(allPokemon);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }
    
    // If we have Pokemon and not loading, return them immediately
    if (allPokemon && allPokemon.length > 0) {
      console.log(`🔧 [POKEMON_SERVICE] Using loaded Pokemon from cache: ${allPokemon.length}`);
      return allPokemon;
    }
    
    // CRITICAL FIX: Only return empty if truly no data available
    console.log(`🔧 [POKEMON_SERVICE] No Pokemon available - this should rarely happen`);
    return [];
  }, [allPokemon, isLoading]);

  return {
    getAllPokemon,
    isLoading
  };
};
