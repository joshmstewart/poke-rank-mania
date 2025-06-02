
import { useEffect, useCallback } from 'react';

interface BattleStateData {
  battlesCompleted: number;
  currentBattle: any[];
  selectedPokemon: number[];
  battleHistory: any[];
  battleResults: any[];
  lastBattleTimestamp: string;
}

// CRITICAL FIX: Add manual localStorage check like TrueSkill store
console.log(`🏟️ [BATTLE_PERSISTENCE_FIX] ===== CHECKING LOCALSTORAGE FOR BATTLE STATE =====`);
const checkBattleStateStorage = () => {
  try {
    const battleState = localStorage.getItem('pokemon-battle-state');
    const battleCount = localStorage.getItem('pokemon-battle-count');
    
    console.log(`🏟️ [BATTLE_PERSISTENCE_FIX] Battle state exists:`, !!battleState);
    console.log(`🏟️ [BATTLE_PERSISTENCE_FIX] Battle count exists:`, !!battleCount);
    
    if (battleState) {
      const parsed = JSON.parse(battleState);
      console.log(`🏟️ [BATTLE_PERSISTENCE_FIX] Parsed battle state:`, parsed);
      return parsed;
    }
  } catch (error) {
    console.error(`🏟️ [BATTLE_PERSISTENCE_FIX] Failed to parse battle state:`, error);
  }
  return null;
};

export const useBattleStatePersistence = () => {
  const saveBattleState = useCallback((stateData: BattleStateData) => {
    console.log("[BATTLE_PERSISTENCE] Saving battle state:", stateData);
    try {
      const dataToSave = {
        ...stateData,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pokemon-battle-state', JSON.stringify(dataToSave));
      console.log("[BATTLE_PERSISTENCE] Battle state saved successfully");
      
      // CRITICAL FIX: Verify the save worked
      const verification = localStorage.getItem('pokemon-battle-state');
      if (!verification) {
        console.error('[BATTLE_PERSISTENCE_FIX] Save verification failed!');
      } else {
        console.log('[BATTLE_PERSISTENCE_FIX] Save verified successfully');
      }
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
      
      // CRITICAL FIX: Try manual check if regular load fails
      const manualCheck = checkBattleStateStorage();
      if (manualCheck) {
        console.log("[BATTLE_PERSISTENCE_FIX] Manual check succeeded:", manualCheck);
        return manualCheck;
      }
    } catch (error) {
      console.error("[BATTLE_PERSISTENCE] Error loading battle state:", error);
      
      // CRITICAL FIX: Final fallback attempt
      console.log("[BATTLE_PERSISTENCE_FIX] Attempting fallback load");
      const fallbackData = checkBattleStateStorage();
      if (fallbackData) {
        console.log("[BATTLE_PERSISTENCE_FIX] Fallback load successful:", fallbackData);
        return fallbackData;
      }
    }
    return null;
  }, []);

  const clearBattleState = useCallback(() => {
    console.log("[BATTLE_PERSISTENCE] Clearing battle state");
    localStorage.removeItem('pokemon-battle-state');
    
    // CRITICAL FIX: Verify the clear worked
    const verification = localStorage.getItem('pokemon-battle-state');
    if (verification) {
      console.error('[BATTLE_PERSISTENCE_FIX] Clear verification failed!');
    } else {
      console.log('[BATTLE_PERSISTENCE_FIX] Clear verified successfully');
    }
  }, []);

  // Save battle count separately for quick access
  const saveBattleCount = useCallback((count: number) => {
    localStorage.setItem('pokemon-battle-count', String(count));
    console.log("[BATTLE_PERSISTENCE] Saved battle count:", count);
    
    // CRITICAL FIX: Verify the save worked
    const verification = localStorage.getItem('pokemon-battle-count');
    if (verification !== String(count)) {
      console.error('[BATTLE_PERSISTENCE_FIX] Battle count save verification failed!');
    } else {
      console.log('[BATTLE_PERSISTENCE_FIX] Battle count save verified successfully');
    }
  }, []);

  const loadBattleCount = useCallback((): number => {
    const saved = localStorage.getItem('pokemon-battle-count');
    const count = saved ? parseInt(saved, 10) : 0;
    console.log("[BATTLE_PERSISTENCE] Loaded battle count:", count);
    
    // CRITICAL FIX: Validate the loaded count
    if (isNaN(count)) {
      console.warn('[BATTLE_PERSISTENCE_FIX] Invalid battle count loaded, defaulting to 0');
      return 0;
    }
    
    return count;
  }, []);

  // CRITICAL FIX: Add manual reload function like TrueSkill store
  const forceReloadBattleState = useCallback((): BattleStateData | null => {
    console.log('[BATTLE_PERSISTENCE_FIX] ===== FORCE RELOAD BATTLE STATE =====');
    const manualData = checkBattleStateStorage();
    if (manualData) {
      console.log('[BATTLE_PERSISTENCE_FIX] Force reload successful:', manualData);
      return manualData;
    }
    console.log('[BATTLE_PERSISTENCE_FIX] Force reload found no data');
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
