
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStarterValidation = (allPokemon: Pokemon[]) => {
  const RECENT_MEMORY_SIZE = Math.min(100, Math.floor(allPokemon.length * 0.1));

  const filterCandidatePokemon = (
    availablePokemon: Pokemon[],
    recentlySeenPokemon: Set<number>,
    battleSize: number
  ): Pokemon[] => {
    let candidatePokemon = availablePokemon.filter(p => !recentlySeenPokemon.has(p.id));
    
    console.log(`🎮 [BATTLE_REPEAT_DEBUG] Candidates after filtering recent: ${candidatePokemon.length}`);
    
    if (candidatePokemon.length < battleSize * 3) {
      const recentArray = Array.from(recentlySeenPokemon);
      const lessRecentThreshold = Math.floor(recentArray.length * 0.5);
      const lessRecent = new Set(recentArray.slice(0, lessRecentThreshold));
      
      candidatePokemon = availablePokemon.filter(p => !lessRecent.has(p.id));
      console.log(`⚠️ Expanded candidate pool by including less recent Pokemon: ${candidatePokemon.length} available`);
    }
    
    if (candidatePokemon.length < battleSize) {
      candidatePokemon = availablePokemon;
      console.log(`⚠️ Using full pool due to insufficient candidates: ${candidatePokemon.length}`);
    }

    return candidatePokemon;
  };

  const validateBattle = (battlePokemon: Pokemon[], battleSize: number): boolean => {
    if (!battlePokemon || battlePokemon.length !== battleSize) {
      console.error(`🚨 [BATTLE_REPEAT_DEBUG] FAILED to create proper battle! Got ${battlePokemon?.length || 0} Pokemon, expected ${battleSize}`);
      return false;
    }
    return true;
  };

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
    filterCandidatePokemon,
    validateBattle,
    logPokemonTypeData
  };
};
