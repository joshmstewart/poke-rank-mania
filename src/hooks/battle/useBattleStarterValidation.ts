
import { Pokemon } from "@/services/pokemon";
import { useBattleStarterFiltering } from "./useBattleStarterFiltering";
import { useBattleStarterBattleValidation } from "./useBattleStarterBattleValidation";
import { useBattleStarterDebugLogging } from "./useBattleStarterDebugLogging";

export const useBattleStarterValidation = (allPokemon: Pokemon[]) => {
  const { filterCandidatePokemon, RECENT_MEMORY_SIZE } = useBattleStarterFiltering(allPokemon);
  const { validateBattle } = useBattleStarterBattleValidation();
  const { logPokemonTypeData } = useBattleStarterDebugLogging();

  return {
    filterCandidatePokemon,
    validateBattle,
    logPokemonTypeData,
    RECENT_MEMORY_SIZE
  };
};
