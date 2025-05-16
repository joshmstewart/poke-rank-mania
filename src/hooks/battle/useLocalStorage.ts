
import { toast } from "@/hooks/use-toast";
import { BattleState } from "./types";

export const useLocalStorage = () => {
  // Save battle state to local storage
  const saveBattleState = () => {
    try {
      const state = {
        selectedGeneration: Number(localStorage.getItem('pokemon-ranker-generation') || 0),
        battleType: localStorage.getItem('pokemon-battle-type') || 'pairs',
        battleResults: localStorage.getItem('pokemon-battle-results') ? 
          JSON.parse(localStorage.getItem('pokemon-battle-results') || '[]') : [],
        battlesCompleted: Number(localStorage.getItem('pokemon-battles-completed') || 0),
        battleHistory: localStorage.getItem('pokemon-battle-history') ? 
          JSON.parse(localStorage.getItem('pokemon-battle-history') || '[]') : [],
        completionPercentage: Number(localStorage.getItem('pokemon-completion-percentage') || 0),
        fullRankingMode: localStorage.getItem('pokemon-ranker-full-ranking-mode') === 'true'
      };
      
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
