
import { useEffect, useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

export const useBattleStarterEvents = (
  filteredPokemon: Pokemon[],
  currentBattle: Pokemon[],
  initialBattleStartedRef: React.MutableRefObject<boolean>,
  autoTriggerDisabledRef: React.MutableRefObject<boolean>,
  startNewBattleCallback: ((battleType: BattleType) => Pokemon[]) | null,
  initializationTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  initializationCompleteRef: React.MutableRefObject<boolean>,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  stableSetSelectedPokemon: (pokemon: number[]) => void
) => {
  const { getAllPendingIds, isHydrated } = useCloudPendingBattles();
  
  console.log(`🎯 [BATTLE_STARTER_EVENTS] Hook initialized - hydrated: ${isHydrated}`);
  console.log(`🎯 [BATTLE_STARTER_EVENTS] startNewBattleCallback available: ${!!startNewBattleCallback}`);

  // CRITICAL FIX: Create stable callback for pending check
  const checkForPendingPokemon = useCallback(() => {
    if (filteredPokemon.length === 0) return;
    if (!isHydrated) return;
    if (currentBattle.length > 0) return;
    if (!startNewBattleCallback) return;

    const pendingIds = getAllPendingIds();
    console.log(`🎯🎯🎯 [BATTLE_STARTER_PENDING_CHECK] Checking pending Pokemon: ${pendingIds}`);
    console.log(`🎯🎯🎯 [BATTLE_STARTER_PENDING_CHECK] Current battle length: ${currentBattle.length}`);
    console.log(`🎯🎯🎯 [BATTLE_STARTER_PENDING_CHECK] Callback available: ${!!startNewBattleCallback}`);
    
    if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
      console.log(`🎯🎯🎯 [BATTLE_STARTER_PENDING_CHECK] Found ${pendingIds.length} pending Pokemon, starting battle`);
      
      setTimeout(() => {
        if (startNewBattleCallback && currentBattle.length === 0) {
          console.log(`🎯🎯🎯 [BATTLE_STARTER_PENDING_CHECK] Triggering battle for pending Pokemon`);
          const result = startNewBattleCallback("pairs");
          console.log(`🎯🎯🎯 [BATTLE_STARTER_PENDING_CHECK] Battle result:`, result?.map(p => p.name));
        }
      }, 100);
    }
  }, [filteredPokemon.length, isHydrated, currentBattle.length, startNewBattleCallback, getAllPendingIds]);

  // Listen for specific pending battle events
  useEffect(() => {
    const handlePendingBattlesDetected = (event: CustomEvent) => {
      const eventId = `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🎯🎯🎯 [${eventId}] ===== PENDING BATTLES DETECTED EVENT =====`);
      console.log(`🎯🎯🎯 [${eventId}] Event detail:`, event.detail);
      console.log(`🎯🎯🎯 [${eventId}] startNewBattleCallback available: ${!!startNewBattleCallback}`);
      
      if (event.detail?.pendingPokemon && Array.isArray(event.detail.pendingPokemon)) {
        console.log(`🎯🎯🎯 [${eventId}] Pending Pokemon from event: ${event.detail.pendingPokemon}`);
        
        if (currentBattle.length === 0 && startNewBattleCallback) {
          console.log(`🎯🎯🎯 [${eventId}] ✅ TRIGGERING BATTLE FOR PENDING POKEMON`);
          
          setTimeout(() => {
            if (startNewBattleCallback && currentBattle.length === 0) {
              console.log(`🎯🎯🎯 [${eventId}] Executing startNewBattle for pending Pokemon`);
              const result = startNewBattleCallback("pairs");
              console.log(`🎯🎯🎯 [${eventId}] Battle result:`, result?.map(p => p.name));
            }
          }, 100);
        }
      }
    };

    const handlePokemonStarred = (event: CustomEvent) => {
      const eventId = `STAR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`⭐⭐⭐ [${eventId}] ===== POKEMON STARRED EVENT =====`);
      console.log(`⭐⭐⭐ [${eventId}] startNewBattleCallback available: ${!!startNewBattleCallback}`);
      
      if (currentBattle.length === 0 && startNewBattleCallback) {
        console.log(`⭐⭐⭐ [${eventId}] ✅ TRIGGERING BATTLE AFTER STAR`);
        
        setTimeout(() => {
          if (startNewBattleCallback && currentBattle.length === 0) {
            console.log(`⭐⭐⭐ [${eventId}] Executing startNewBattle after star`);
            const result = startNewBattleCallback("pairs");
            console.log(`⭐⭐⭐ [${eventId}] Battle result:`, result?.map(p => p.name));
          }
        }, 200);
      }
    };

    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, [currentBattle.length, startNewBattleCallback]); // CRITICAL FIX: Include startNewBattleCallback in deps

  // CRITICAL FIX: Initial pending check with stable dependencies
  useEffect(() => {
    console.log(`🎯 [BATTLE_STARTER_EVENTS] Hydration status from pending hook: ${isHydrated}`);
    
    if (isHydrated && filteredPokemon.length > 0) {
      checkForPendingPokemon();
    }
  }, [isHydrated, filteredPokemon.length, checkForPendingPokemon]);

  // CRITICAL FIX: Auto-trigger first battle with stable dependencies
  useEffect(() => {
    if (
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallback &&
      isHydrated
    ) {
      console.log(`🔥 [BATTLE_STARTER_EVENTS] Auto-triggering first battle with ${filteredPokemon.length} Pokemon`);
      
      const pendingIds = getAllPendingIds();
      console.log(`🔥 [BATTLE_STARTER_EVENTS] Pending check before auto-trigger: ${pendingIds}`);
      
      const triggerTimer = setTimeout(() => {
        if (startNewBattleCallback && currentBattle.length === 0) {
          console.log(`🔥 [BATTLE_STARTER_EVENTS] Executing auto-trigger for first battle`);
          const result = startNewBattleCallback("pairs");
          console.log(`🔥 [BATTLE_STARTER_EVENTS] Auto-trigger result:`, result?.map(p => p.name));
          initialBattleStartedRef.current = true;
        }
      }, 200);

      return () => clearTimeout(triggerTimer);
    }
  }, [
    filteredPokemon.length,
    currentBattle.length,
    isHydrated,
    startNewBattleCallback,
    getAllPendingIds
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    };
  }, []);
};
