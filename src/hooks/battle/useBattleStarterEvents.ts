
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

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
  useEffect(() => {
    console.log(
      `🎯 [BATTLE_STARTER_EVENTS] Hydration status from pending hook: ${isHydrated}`
    );
  }, [isHydrated]);
  const pendingCheckRef = useRef(false);

  // ENHANCED: Listen for specific pending battle events
  useEffect(() => {
    const handlePendingBattlesDetected = (event: CustomEvent) => {
      const eventId = `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🎯🎯🎯 [${eventId}] ===== PENDING BATTLES DETECTED EVENT =====`);
      console.log(`🎯🎯🎯 [${eventId}] Event detail:`, event.detail);
      console.log(`🎯🎯🎯 [${eventId}] Current battle length: ${currentBattle.length}`);
      console.log(`🎯🎯🎯 [${eventId}] startNewBattleCallbackRef exists: ${!!startNewBattleCallbackRef.current}`);
      
      if (event.detail?.pendingPokemon && Array.isArray(event.detail.pendingPokemon)) {
        console.log(`🎯🎯🎯 [${eventId}] Pending Pokemon from event: ${event.detail.pendingPokemon}`);
        
        // Verify these Pokemon still exist in pending state
        const currentPending = getAllPendingIds();
        console.log(`🎯🎯🎯 [${eventId}] Current pending from store: ${currentPending}`);
        
        if (currentPending.length > 0 && currentBattle.length === 0) {
          console.log(`🎯🎯🎯 [${eventId}] ✅ TRIGGERING BATTLE FOR PENDING POKEMON`);
          
          setTimeout(() => {
            if (startNewBattleCallbackRef.current) {
              console.log(`🎯🎯🎯 [${eventId}] Executing startNewBattle for pending Pokemon`);
              const result = startNewBattleCallbackRef.current("pairs");
              console.log(`🎯🎯🎯 [${eventId}] Battle result:`, result?.map(p => p.name));
            } else {
              console.error(`🎯🎯🎯 [${eventId}] ❌ startNewBattleCallbackRef not available`);
            }
          }, 100);
        } else {
          console.log(`🎯🎯🎯 [${eventId}] ⚠️ Not triggering battle - no pending: ${currentPending.length}, battle exists: ${currentBattle.length}`);
        }
      } else {
        console.log(`🎯🎯🎯 [${eventId}] ⚠️ No valid pending Pokemon in event detail`);
      }
    };

    const handlePokemonStarred = (event: CustomEvent) => {
      const eventId = `STAR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`⭐⭐⭐ [${eventId}] ===== POKEMON STARRED EVENT =====`);
      console.log(`⭐⭐⭐ [${eventId}] Event detail:`, event.detail);
      console.log(`⭐⭐⭐ [${eventId}] Pokemon ID: ${event.detail?.pokemonId}`);
      
      // Check if we should trigger a battle immediately
      const currentPending = getAllPendingIds();
      console.log(`⭐⭐⭐ [${eventId}] Current pending after star: ${currentPending}`);
      
      if (currentPending.length > 0 && currentBattle.length === 0) {
        console.log(`⭐⭐⭐ [${eventId}] ✅ TRIGGERING BATTLE AFTER STAR`);
        
        setTimeout(() => {
          if (startNewBattleCallbackRef.current) {
            console.log(`⭐⭐⭐ [${eventId}] Executing startNewBattle after star`);
            const result = startNewBattleCallbackRef.current("pairs");
            console.log(`⭐⭐⭐ [${eventId}] Battle result:`, result?.map(p => p.name));
          }
        }, 200);
      }
    };

    // Listen for both types of events
    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, [getAllPendingIds, currentBattle.length, startNewBattleCallbackRef]);

  // CRITICAL FIX: Check for pending Pokemon when battle mode initializes
  useEffect(() => {
    if (filteredPokemon.length === 0) return;
    if (!isHydrated || pendingCheckRef.current) return;

    const checkPendingOnInit = () => {
      const pendingIds = getAllPendingIds();
      console.log(`🎯 [BATTLE_STARTER_EVENTS] Checking pending Pokemon on init: ${pendingIds}`);
      
      if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
        console.log(`🎯 [BATTLE_STARTER_EVENTS] Found ${pendingIds.length} pending Pokemon, starting battle`);
        
        // Set flag to prevent duplicate checks
        pendingCheckRef.current = true;
        
        // Small delay to ensure all components are ready
        setTimeout(() => {
          if (startNewBattleCallbackRef.current && currentBattle.length === 0) {
            console.log(`🎯 [BATTLE_STARTER_EVENTS] Triggering battle for pending Pokemon`);
            const result = startNewBattleCallbackRef.current("pairs");
            console.log(`🎯 [BATTLE_STARTER_EVENTS] Battle result:`, result?.map(p => p.name));
          } else {
            console.log(`🎯 [BATTLE_STARTER_EVENTS] Battle callback not ready or battle already exists`);
          }
        }, 100);
      } else {
        console.log(`🎯 [BATTLE_STARTER_EVENTS] No pending Pokemon found on init`);
        console.log(`🎯 [BATTLE_STARTER_EVENTS] pendingIds type: ${typeof pendingIds}, isArray: ${Array.isArray(pendingIds)}`);
        pendingCheckRef.current = true;
      }
    };

    // Run the check immediately if hydrated
    checkPendingOnInit();
  }, [
    isHydrated,
    getAllPendingIds,
    currentBattle.length,
    startNewBattleCallbackRef,
    filteredPokemon.length,
  ]);

  // CRITICAL FIX: Auto-trigger first battle when no battle exists and we have Pokemon
  useEffect(() => {
    if (
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current &&
      isHydrated
    ) {
      console.log(`🔥 [BATTLE_STARTER_EVENTS] Auto-triggering first battle with ${filteredPokemon.length} Pokemon`);
      
      // Check if we have pending battles first
      const pendingIds = getAllPendingIds();
      console.log(`🔥 [BATTLE_STARTER_EVENTS] Pending check before auto-trigger: ${pendingIds}`);
      
      // Small delay to ensure all hooks are ready
      const triggerTimer = setTimeout(() => {
        if (startNewBattleCallbackRef.current) {
          console.log(`🔥 [BATTLE_STARTER_EVENTS] Executing auto-trigger for first battle`);
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(`🔥 [BATTLE_STARTER_EVENTS] Auto-trigger result:`, result?.map(p => p.name));
          initialBattleStartedRef.current = true;
        }
      }, 200);

      return () => clearTimeout(triggerTimer);
    }
  }, [
    filteredPokemon.length,
    currentBattle.length,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    startNewBattleCallbackRef,
    isHydrated,
    getAllPendingIds
  ]);

  // CRITICAL FIX: Listen for mode switch events and check for pending battles
  useEffect(() => {
    if (filteredPokemon.length === 0) return;
    if (!isHydrated) return;
    const handleModeSwitch = (event: CustomEvent) => {
      console.log(`🎯 [BATTLE_STARTER_EVENTS] Mode switch detected:`, event.detail);
      
      if (event.detail?.mode === 'battle' && isHydrated) {
        // Reset pending check flag when switching to battle mode
        pendingCheckRef.current = false;
        
        // Check for pending Pokemon after mode switch
        setTimeout(() => {
          const pendingIds = getAllPendingIds();
          console.log(`🎯 [BATTLE_STARTER_EVENTS] Post-switch pending check: ${pendingIds}`);
          
          if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0 && currentBattle.length === 0) {
            console.log(`🎯 [BATTLE_STARTER_EVENTS] Triggering battle after mode switch`);
            if (startNewBattleCallbackRef.current) {
              const result = startNewBattleCallbackRef.current("pairs");
              console.log(`🎯 [BATTLE_STARTER_EVENTS] Post-switch battle result:`, result?.map(p => p.name));
            }
          }
        }, 300);
      }
    };

    // Listen for mode switch events
    document.addEventListener('mode-switch', handleModeSwitch as EventListener);
    
    return () => {
      document.removeEventListener('mode-switch', handleModeSwitch as EventListener);
    };
  }, [
    getAllPendingIds,
    currentBattle.length,
    startNewBattleCallbackRef,
    isHydrated,
    filteredPokemon.length,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    };
  }, [initializationTimerRef]);
};
