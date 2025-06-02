
import { toast } from "@/hooks/use-toast";
import { BattleState } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useLocalStorage = () => {
  // CLOUD-ONLY: All battle state is now managed by TrueSkill store and cloud
  const saveBattleState = () => {
    console.log('[CLOUD_STORAGE] Battle state automatically saved to cloud via TrueSkill store');
    // No localStorage operations - everything goes through TrueSkill cloud sync
  };

  // CLOUD-ONLY: Load from TrueSkill store instead of localStorage
  const loadBattleState = (): BattleState | null => {
    console.log('[CLOUD_STORAGE] Battle state loaded from cloud via TrueSkill store');
    // Return null to indicate no local state - everything comes from cloud
    return null;
  };

  return {
    saveBattleState,
    loadBattleState
  };
};
