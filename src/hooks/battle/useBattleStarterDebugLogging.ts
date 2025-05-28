
import { Pokemon } from "@/services/pokemon";

export const useBattleStarterDebugLogging = () => {
  const logPokemonTypeData = (battlePokemon: Pokemon[]) => {
    battlePokemon.forEach(pokemon => {
      console.log(`🎯 [TYPE_DEBUG] Battle Pokemon: ${pokemon.name} (ID: ${pokemon.id})`);
      console.log(`🎯 [TYPE_DEBUG] - Raw types:`, pokemon.types);
      console.log(`🎯 [TYPE_DEBUG] - Types is array:`, Array.isArray(pokemon.types));
      console.log(`🎯 [TYPE_DEBUG] - Types length:`, pokemon.types?.length || 0);
      if (pokemon.types && pokemon.types.length > 0) {
        console.log(`🎯 [TYPE_DEBUG] - First type:`, pokemon.types[0]);
        console.log(`🎯 [TYPE_DEBUG] - Type of first element:`, typeof pokemon.types[0]);
      } else {
        console.error(`🚨 [TYPE_DEBUG] - NO TYPES FOUND for ${pokemon.name}!`);
      }
    });
  };

  return {
    logPokemonTypeData
  };
};
