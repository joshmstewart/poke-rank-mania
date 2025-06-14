
import { useCallback } from 'react';

interface BattleStateData {
  battlesCompleted: number;
  currentBattle: any[];
  selectedPokemon: number[];
  battleHistory: any[];
  battleResults: any[];
  lastBattleTimestamp: string;
}

// THIS HOOK IS DEPRECATED AND REPLACED BY THE TRUESKILL STORE
// All functions are no-ops to ensure no data is written to localStorage
// by legacy systems.

export const useBattleStatePersistence = () => {
  const saveBattleState = useCallback((stateData: BattleStateData) => {
    // No-op: State is persisted via TrueSkill store
    console.log("[BATTLE_PERSISTENCE_DEPRECATED] saveBattleState called, but it's a no-op.");
  }, []);

  const loadBattleState = useCallback((): BattleStateData | null => {
    // No-op: State is loaded from TrueSkill store
    console.log("[BATTLE_PERSISTENCE_DEPRECATED] loadBattleState called, but it's a no-op.");
    return null;
  }, []);

  const clearBattleState = useCallback(() => {
    // No-op: State is cleared via TrueSkill store
    console.log("[BATTLE_PERSISTENCE_DEPRECATED] clearBattleState called, but it's a no-op.");
  }, []);

  const saveBattleCount = useCallback((count: number) => {
    // No-op: Count is persisted via TrueSkill store
    console.log("[BATTLE_PERSISTENCE_DEPRECATED] saveBattleCount called, but it's a no-op.");
  }, []);

  const loadBattleCount = useCallback((): number => {
    // No-op: Count is loaded from TrueSkill store
    console.log("[BATTLE_PERSISTENCE_DEPRECATED] loadBattleCount called, but it's a no-op.");
    return 0; // Always return 0, TrueSkill store is source of truth
  }, []);
  
  const forceReloadBattleState = useCallback((): BattleStateData | null => {
      console.log('[BATTLE_PERSISTENCE_DEPRECATED] forceReloadBattleState called, but it is a no-op.');
      return null;
  }, []);

  return {
    saveBattleState,
    loadBattleState,
    clearBattleState,
    saveBattleCount,
    loadBattleCount,
    forceReloadBattleState
  };
};
