
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

export const usePokemonService = () => {
  const { allPokemon, isLoading } = usePokemonLoader();
  
  const getAllPokemon = useCallback(async (): Promise<Pokemon[]> => {
    console.log(`🔧 [POKEMON_SERVICE] Getting all Pokemon from loader service`);
    console.log(`🔧 [POKEMON_SERVICE] Current state - isLoading: ${isLoading}, Pokemon count: ${allPokemon.length}`);
    
    // CRITICAL FIX: Wait for loading to complete before returning data
    if (isLoading) {
      console.log(`🔧 [POKEMON_SERVICE] Still loading, waiting for completion...`);
      
      // Return a promise that resolves when loading is complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isLoading && allPokemon.length > 0) {
            clearInterval(checkInterval);
            console.log(`🔧 [POKEMON_SERVICE] Loading completed, returning ${allPokemon.length} Pokemon`);
            resolve(allPokemon);
          } else if (!isLoading && allPokemon.length === 0) {
            // Loading finished but no Pokemon - this might be a real failure
            clearInterval(checkInterval);
            console.log(`🔧 [POKEMON_SERVICE] Loading completed but no Pokemon found`);
            resolve([]);
          }
        }, 100); // Check every 100ms
        
        // Timeout after 10 seconds to prevent infinite waiting
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log(`🔧 [POKEMON_SERVICE] Timeout waiting for Pokemon load, returning current: ${allPokemon.length}`);
          resolve(allPokemon);
        }, 10000);
      });
    }
    
    // If not loading and we have Pokemon, return them
    if (allPokemon && allPokemon.length > 0) {
      console.log(`🔧 [POKEMON_SERVICE] Returning ${allPokemon.length} Pokemon from loader`);
      return allPokemon;
    }
    
    // No Pokemon available
    console.log(`🔧 [POKEMON_SERVICE] No Pokemon available from loader`);
    return [];
  }, [allPokemon, isLoading]);

  return {
    getAllPokemon,
    isLoading
  };
};
