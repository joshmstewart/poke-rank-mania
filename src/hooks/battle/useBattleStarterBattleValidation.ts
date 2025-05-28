
import { Pokemon } from "@/services/pokemon";

export const useBattleStarterBattleValidation = () => {
  const validateBattle = (battlePokemon: Pokemon[], battleSize: number): boolean => {
    if (!battlePokemon || battlePokemon.length !== battleSize) {
      console.error(`🚨 [BATTLE_REPEAT_DEBUG] FAILED to create proper battle! Got ${battlePokemon?.length || 0} Pokemon, expected ${battleSize}`);
      return false;
    }
    return true;
  };

  return {
    validateBattle
  };
};
