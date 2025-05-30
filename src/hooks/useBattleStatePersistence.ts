
import { useEffect, useCallback } from 'react';

interface BattleStateData {
  battlesCompleted: number;
  currentBattle: any[];
  selectedPokemon: number[];
  battleHistory: any[];
  battleResults: any[];
  lastBattleTimestamp: string;
}

export const useBattleStatePersistence = () => {
  const saveBattleState = useCallback((stateData: BattleStateData) => {
    console.log("[BATTLE_PERSISTENCE] Saving battle state:", stateData);
    try {
      localStorage.setItem('pokemon-battle-state', JSON.stringify({
        ...stateData,
        savedAt: new Date().toISOString()
      }));
      console.log("[BATTLE_PERSISTENCE] Battle state saved successfully");
    } catch (error) {
      console.error("[BATTLE_PERSISTENCE] Error saving battle state:", error);
    }
  }, []);

  const loadBattleState = useCallback((): BattleStateData | null => {
    try {
      const saved = localStorage.getItem('pokemon-battle-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("[BATTLE_PERSISTENCE] Loaded battle state:", parsed);
        return parsed;
      }
    } catch (error) {
      console.error("[BATTLE_PERSISTENCE] Error loading battle state:", error);
    }
    return null;
  }, []);

  const clearBattleState = useCallback(() => {
    console.log("[BATTLE_PERSISTENCE] Clearing battle state");
    localStorage.removeItem('pokemon-battle-state');
  }, []);

  // Save battle count separately for quick access
  const saveBattleCount = useCallback((count: number) => {
    localStorage.setItem('pokemon-battle-count', String(count));
    console.log("[BATTLE_PERSISTENCE] Saved battle count:", count);
  }, []);

  const loadBattleCount = useCallback((): number => {
    const saved = localStorage.getItem('pokemon-battle-count');
    const count = saved ? parseInt(saved, 10) : 0;
    console.log("[BATTLE_PERSISTENCE] Loaded battle count:", count);
    return count;
  }, []);

  return {
    saveBattleState,
    loadBattleState,
    clearBattleState,
    saveBattleCount,
    loadBattleCount
  };
};
