
import { toast } from "@/hooks/use-toast";
import { BattleState } from "./types";

export const useLocalStorage = () => {
  // Save battle state to local storage
  const saveBattleState = (state: BattleState) => {
    try {
      localStorage.setItem('pokemon-battle-state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving battle state:', error);
    }
  };

  // Load battle state from local storage
  const loadBattleState = (): BattleState | null => {
    try {
      const savedState = localStorage.getItem('pokemon-battle-state');
      if (savedState) {
        return JSON.parse(savedState);
      }
      return null;
    } catch (error) {
      console.error('Error loading battle state:', error);
      return null;
    }
  };

  return {
    saveBattleState,
    loadBattleState
  };
};
