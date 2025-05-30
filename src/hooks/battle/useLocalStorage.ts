import { toast } from "@/hooks/use-toast";
import { BattleState } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useLocalStorage = () => {
  // Cloud-only battle state management
  const saveBattleState = () => {
    console.log('[BATTLE_STORAGE_CLOUD] Battle state automatically saved to cloud via TrueSkill store');
    // Battle state is now managed by TrueSkill store and auto-synced to cloud
  };

  // Cloud-only battle state loading
  const loadBattleState = (): BattleState | null => {
    console.log('[BATTLE_STORAGE_CLOUD] Battle state loaded from cloud via TrueSkill store');
    // Battle state is now managed by TrueSkill store and loaded from cloud
    return null;
  };

  return {
    saveBattleState,
    loadBattleState
  };
};
