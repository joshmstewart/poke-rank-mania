
import { useCallback } from "react";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

export const usePokemonService = () => {
  const { allPokemon } = usePokemonLoader();
  
  const getAllPokemon = useCallback(async () => {
    console.log(`🔧 [POKEMON_SERVICE] Getting all Pokemon from loader service`);
    
    // If we already have Pokemon loaded, return them immediately
    if (allPokemon && allPokemon.length > 0) {
      console.log(`🔧 [POKEMON_SERVICE] Using cached Pokemon from loader: ${allPokemon.length}`);
      return allPokemon;
    }
    
    // If not loaded yet, this will trigger loading and return empty array temporarily
    console.log(`🔧 [POKEMON_SERVICE] No Pokemon loaded yet, returning empty array`);
    return [];
  }, [allPokemon]);

  return {
    getAllPokemon
  };
};
