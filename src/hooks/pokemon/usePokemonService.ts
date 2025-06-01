
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

export const usePokemonService = () => {
  const { allPokemon, isLoading } = usePokemonLoader();
  
  const getAllPokemon = useCallback(async (): Promise<Pokemon[]> => {
    console.log(`🔧 [POKEMON_SERVICE] Getting all Pokemon from loader service`);
    console.log(`🔧 [POKEMON_SERVICE] Current state - isLoading: ${isLoading}, Pokemon count: ${allPokemon.length}`);
    
    // FIXED: Don't use broken polling - just return what we have
    // If still loading and no Pokemon, return empty (this is expected)
    if (isLoading && allPokemon.length === 0) {
      console.log(`🔧 [POKEMON_SERVICE] Still loading and no Pokemon yet - returning empty`);
      return [];
    }
    
    // If we have Pokemon, return them regardless of loading state
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
