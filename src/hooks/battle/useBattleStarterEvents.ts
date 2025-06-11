
import { useEffect, useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useCloudPendingBattles } from "./useCloudPendingBattles";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleStarterEvents = (
  filteredPokemon: Pokemon[],
  currentBattle: Pokemon[],
  initialBattleStartedRef: React.MutableRefObject<boolean>,
  autoTriggerDisabledRef: React.MutableRefObject<boolean>,
  startNewBattleCallbackRef: React.MutableRefObject<((battleType: BattleType) => Pokemon[]) | null>,
  initializationTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  initializationCompleteRef: React.MutableRefObject<boolean>,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  stableSetSelectedPokemon: (pokemon: number[]) => void
) => {
  const { getAllPendingIds, isHydrated } = useCloudPendingBattles();
  const { initiatePendingBattle, setInitiatePendingBattle } = useTrueSkillStore();
  
  console.log(`🔍 [DEBUG_EVENTS] useBattleStarterEvents hook initialized - hydrated: ${isHydrated}`);
  
  const filteredPokemonCountRef = useRef(filteredPokemon.length);
  const currentBattleLengthRef = useRef(currentBattle.length);
  const isHydratedRef = useRef(isHydrated);
  const componentMountedRef = useRef(true);
  
  // Update refs when values change
  filteredPokemonCountRef.current = filteredPokemon.length;
  currentBattleLengthRef.current = currentBattle.length;
  isHydratedRef.current = isHydrated;

  const checkForPendingPokemon = useCallback(() => {
    console.log(`🔍 [DEBUG_EVENTS] ===== checkForPendingPokemon CALLED =====`);
    
    if (!componentMountedRef.current) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Component unmounted`);
      return;
    }
    
    if (filteredPokemonCountRef.current === 0 || !isHydratedRef.current) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ No Pokemon or not hydrated`);
      return;
    }
    
    if (currentBattleLengthRef.current > 0) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Current battle exists`);
      return;
    }

    const pendingIds = getAllPendingIds();
    console.log(`🔍 [DEBUG_EVENTS] Pending IDs check:`, pendingIds);
    
    if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
      console.log(`🔍 [DEBUG_EVENTS] ✅ Found ${pendingIds.length} pending Pokemon`);
      
      setTimeout(() => {
        if (componentMountedRef.current && startNewBattleCallbackRef.current && currentBattleLengthRef.current === 0) {
          console.log(`🔍 [DEBUG_EVENTS] 🚀 CALLING startNewBattle for pending Pokemon`);
          try {
            const result = startNewBattleCallbackRef.current("pairs");
            console.log(`🔍 [DEBUG_EVENTS] ✅ Battle result:`, result?.map(p => p.name) || 'null');
          } catch (error) {
            console.error(`🔍 [DEBUG_EVENTS] ❌ Error:`, error);
          }
        }
      }, 100);
    }
  }, [getAllPendingIds, startNewBattleCallbackRef]);

  // ROBUST FIX: Check for initiatePendingBattle flag when battle mode is ready
  useEffect(() => {
    if (
      componentMountedRef.current &&
      isHydrated &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current &&
      initiatePendingBattle
    ) {
      console.log(`🚦 [FLAG_COORDINATION] Battle mode ready with initiatePendingBattle flag set`);
      console.log(`🚦 [FLAG_COORDINATION] Triggering pending battle and clearing flag`);
      
      // Clear the flag first to prevent multiple triggers
      setInitiatePendingBattle(false);
      
      // Trigger the pending battle check
      checkForPendingPokemon();
    }
  }, [
    isHydrated,
    filteredPokemon.length,
    currentBattle.length,
    startNewBattleCallbackRef.current,
    initiatePendingBattle,
    setInitiatePendingBattle,
    checkForPendingPokemon
  ]);

  // Event listeners for manual starring (when already in battle mode)
  useEffect(() => {
    console.log(`🔍 [DEBUG_EVENTS] Setting up event listeners`);
    componentMountedRef.current = true;
    
    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`🔍 [DEBUG_EVENTS] POKEMON STARRED EVENT`);
      if (componentMountedRef.current) {
        checkForPendingPokemon();
      }
    };

    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      console.log(`🔍 [DEBUG_EVENTS] Removing event listeners`);
      componentMountedRef.current = false;
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, [checkForPendingPokemon]);

  // Auto-trigger for normal battles (only when no pending Pokemon)
  useEffect(() => {
    if (
      componentMountedRef.current &&
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current &&
      isHydrated &&
      !initiatePendingBattle
    ) {
      const pendingIds = getAllPendingIds();
      
      if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
        console.log(`🔍 [DEBUG_EVENTS] Skipping auto-trigger - pending Pokemon exist`);
        return;
      }
      
      console.log(`🔍 [DEBUG_EVENTS] Auto-triggering first battle`);
      const triggerTimer = setTimeout(() => {
        if (componentMountedRef.current && startNewBattleCallbackRef.current && currentBattle.length === 0) {
          try {
            const result = startNewBattleCallbackRef.current("pairs");
            initialBattleStartedRef.current = true;
          } catch (error) {
            console.error(`🔍 [DEBUG_EVENTS] Auto-trigger error:`, error);
          }
        }
      }, 200);

      return () => clearTimeout(triggerTimer);
    }
  }, [filteredPokemon.length, currentBattle.length, isHydrated, getAllPendingIds, initiatePendingBattle]);

  // Cleanup
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, []);
};
