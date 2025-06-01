
import { useCallback } from "react";
import { fetchAllPokemon } from "@/services/pokemon";

export const usePokemonService = () => {
  const getAllPokemon = useCallback(async () => {
    console.log(`🔧 [POKEMON_SERVICE] Getting all Pokemon from service`);
    const pokemon = await fetchAllPokemon();
    console.log(`🔧 [POKEMON_SERVICE] Retrieved ${pokemon.length} Pokemon from service`);
    return pokemon;
  }, []);

  return {
    getAllPokemon
  };
};
