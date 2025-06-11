
import { useEffect, useRef, useCallback } from "react";
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
  
  console.log(`🔍 [DEBUG_EVENTS] useBattleStarterEvents hook initialized - hydrated: ${isHydrated}`);
  
  // CRITICAL FIX: Use stable refs to prevent dependency changes
  const filteredPokemonCountRef = useRef(filteredPokemon.length);
  const currentBattleLengthRef = useRef(currentBattle.length);
  const isHydratedRef = useRef(isHydrated);
  
  // Update refs when values change
  filteredPokemonCountRef.current = filteredPokemon.length;
  currentBattleLengthRef.current = currentBattle.length;
  isHydratedRef.current = isHydrated;

  // CRITICAL FIX: Create stable callback for pending check
  const checkForPendingPokemon = useCallback(() => {
    console.log(`🔍 [DEBUG_EVENTS] checkForPendingPokemon called`);
    console.log(`🔍 [DEBUG_EVENTS] - filteredPokemonCount: ${filteredPokemonCountRef.current}`);
    console.log(`🔍 [DEBUG_EVENTS] - isHydrated: ${isHydratedRef.current}`);
    console.log(`🔍 [DEBUG_EVENTS] - currentBattleLength: ${currentBattleLengthRef.current}`);
    
    if (filteredPokemonCountRef.current === 0) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ No filtered Pokemon, returning`);
      return;
    }
    if (!isHydratedRef.current) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Not hydrated, returning`);
      return;
    }
    if (currentBattleLengthRef.current > 0) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Current battle exists (${currentBattleLengthRef.current}), returning`);
      return;
    }

    const pendingIds = getAllPendingIds();
    console.log(`🔍 [DEBUG_EVENTS] Getting pending IDs: ${pendingIds}`);
    console.log(`🔍 [DEBUG_EVENTS] Pending IDs type: ${typeof pendingIds}`);
    console.log(`🔍 [DEBUG_EVENTS] Pending IDs isArray: ${Array.isArray(pendingIds)}`);
    console.log(`🔍 [DEBUG_EVENTS] Pending IDs length: ${pendingIds?.length || 'undefined'}`);
    console.log(`🔍 [DEBUG_EVENTS] Callback available: ${!!startNewBattleCallbackRef.current}`);
    console.log(`🔍 [DEBUG_EVENTS] Callback type: ${typeof startNewBattleCallbackRef.current}`);
    
    if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
      console.log(`🔍 [DEBUG_EVENTS] ✅ Found ${pendingIds.length} pending Pokemon, attempting to start battle`);
      
      setTimeout(() => {
        console.log(`🔍 [DEBUG_EVENTS] setTimeout executing...`);
        console.log(`🔍 [DEBUG_EVENTS] - Callback still available: ${!!startNewBattleCallbackRef.current}`);
        console.log(`🔍 [DEBUG_EVENTS] - Current battle length still 0: ${currentBattleLengthRef.current === 0}`);
        
        if (startNewBattleCallbackRef.current && currentBattleLengthRef.current === 0) {
          console.log(`🔍 [DEBUG_EVENTS] 🚀 CALLING startNewBattle callback`);
          try {
            const result = startNewBattleCallbackRef.current("pairs");
            console.log(`🔍 [DEBUG_EVENTS] ✅ Battle result:`, result?.map(p => p.name) || 'null/undefined');
          } catch (error) {
            console.error(`🔍 [DEBUG_EVENTS] ❌ Error calling startNewBattle:`, error);
          }
        } else {
          console.log(`🔍 [DEBUG_EVENTS] ❌ Cannot call callback - callback: ${!!startNewBattleCallbackRef.current}, battle empty: ${currentBattleLengthRef.current === 0}`);
        }
      }, 100);
    } else {
      console.log(`🔍 [DEBUG_EVENTS] ❌ No valid pending Pokemon found`);
    }
  }, [getAllPendingIds, startNewBattleCallbackRef]);

  // Listen for specific pending battle events
  useEffect(() => {
    console.log(`🔍 [DEBUG_EVENTS] Setting up event listeners`);
    
    const handlePendingBattlesDetected = (event: CustomEvent) => {
      const eventId = `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ===== PENDING BATTLES DETECTED EVENT RECEIVED =====`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Event type: ${event.type}`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Event detail:`, event.detail);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Current battle length: ${currentBattleLengthRef.current}`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Callback available: ${!!startNewBattleCallbackRef.current}`);
      
      if (event.detail?.pendingPokemon && Array.isArray(event.detail.pendingPokemon)) {
        console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Pending Pokemon from event: ${event.detail.pendingPokemon}`);
        
        if (currentBattleLengthRef.current === 0) {
          console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ✅ TRIGGERING BATTLE FOR PENDING POKEMON`);
          
          setTimeout(() => {
            console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Event setTimeout executing...`);
            console.log(`🔍 [DEBUG_EVENTS] [${eventId}] - Callback still available: ${!!startNewBattleCallbackRef.current}`);
            console.log(`🔍 [DEBUG_EVENTS] [${eventId}] - Current battle length: ${currentBattleLengthRef.current}`);
            
            if (startNewBattleCallbackRef.current && currentBattleLengthRef.current === 0) {
              console.log(`🔍 [DEBUG_EVENTS] [${eventId}] 🚀 CALLING startNewBattle from event`);
              try {
                const result = startNewBattleCallbackRef.current("pairs");
                console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ✅ Event battle result:`, result?.map(p => p.name) || 'null/undefined');
              } catch (error) {
                console.error(`🔍 [DEBUG_EVENTS] [${eventId}] ❌ Error calling startNewBattle from event:`, error);
              }
            } else {
              console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ❌ Cannot call callback from event`);
            }
          }, 100);
        } else {
          console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ❌ Current battle exists, not triggering`);
        }
      } else {
        console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ❌ No valid pending Pokemon in event detail`);
      }
    };

    const handlePokemonStarred = (event: CustomEvent) => {
      const eventId = `STAR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ===== POKEMON STARRED EVENT RECEIVED =====`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Event detail:`, event.detail);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Current battle length: ${currentBattleLengthRef.current}`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Callback available: ${!!startNewBattleCallbackRef.current}`);
      
      if (currentBattleLengthRef.current === 0) {
        console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ✅ TRIGGERING BATTLE AFTER STAR`);
        
        setTimeout(() => {
          console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Star setTimeout executing...`);
          if (startNewBattleCallbackRef.current && currentBattleLengthRef.current === 0) {
            console.log(`🔍 [DEBUG_EVENTS] [${eventId}] 🚀 CALLING startNewBattle after star`);
            try {
              const result = startNewBattleCallbackRef.current("pairs");
              console.log(`🔍 [DEBUG_EVENTS] [${eventId}] ✅ Star battle result:`, result?.map(p => p.name) || 'null/undefined');
            } catch (error) {
              console.error(`🔍 [DEBUG_EVENTS] [${eventId}] ❌ Error calling startNewBattle after star:`, error);
            }
          }
        }, 200);
      }
    };

    const handleForceCheck = (event: CustomEvent) => {
      console.log(`🔍 [DEBUG_EVENTS] ===== FORCE CHECK EVENT RECEIVED =====`);
      console.log(`🔍 [DEBUG_EVENTS] Force check event detail:`, event.detail);
      checkForPendingPokemon();
    };

    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    document.addEventListener('force-pending-battle-check', handleForceCheck as EventListener);
    
    console.log(`🔍 [DEBUG_EVENTS] Event listeners attached`);
    
    return () => {
      console.log(`🔍 [DEBUG_EVENTS] Removing event listeners`);
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
      document.removeEventListener('force-pending-battle-check', handleForceCheck as EventListener);
    };
  }, []); // CRITICAL FIX: No dependencies to prevent re-running

  // CRITICAL FIX: Initial pending check with stable dependencies
  useEffect(() => {
    console.log(`🔍 [DEBUG_EVENTS] Initial pending check effect triggered`);
    console.log(`🔍 [DEBUG_EVENTS] - isHydrated: ${isHydrated}`);
    console.log(`🔍 [DEBUG_EVENTS] - filteredPokemon.length: ${filteredPokemon.length}`);
    
    if (isHydrated && filteredPokemon.length > 0) {
      console.log(`🔍 [DEBUG_EVENTS] Calling checkForPendingPokemon from initial effect`);
      checkForPendingPokemon();
    } else {
      console.log(`🔍 [DEBUG_EVENTS] Skipping initial check - not ready yet`);
    }
  }, [isHydrated, filteredPokemon.length, checkForPendingPokemon]);

  // CRITICAL FIX: Auto-trigger first battle ONLY if no pending Pokemon exist
  useEffect(() => {
    console.log(`🔍 [DEBUG_EVENTS] Auto-trigger effect checking conditions:`);
    console.log(`🔍 [DEBUG_EVENTS] - initialBattleStarted: ${initialBattleStartedRef.current}`);
    console.log(`🔍 [DEBUG_EVENTS] - autoTriggerDisabled: ${autoTriggerDisabledRef.current}`);
    console.log(`🔍 [DEBUG_EVENTS] - filteredPokemon.length: ${filteredPokemon.length}`);
    console.log(`🔍 [DEBUG_EVENTS] - currentBattle.length: ${currentBattle.length}`);
    console.log(`🔍 [DEBUG_EVENTS] - callback available: ${!!startNewBattleCallbackRef.current}`);
    console.log(`🔍 [DEBUG_EVENTS] - isHydrated: ${isHydrated}`);
    
    if (
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current &&
      isHydrated
    ) {
      // CRITICAL FIX: Check for pending Pokemon IMMEDIATELY before any setTimeout
      const pendingIds = getAllPendingIds();
      console.log(`🔍 [DEBUG_EVENTS] 🚨 IMMEDIATE pending check before auto-trigger: ${pendingIds}`);
      console.log(`🔍 [DEBUG_EVENTS] 🚨 IMMEDIATE pending count: ${pendingIds?.length || 0}`);
      
      if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
        console.log(`🔍 [DEBUG_EVENTS] ❌ PENDING POKEMON DETECTED - COMPLETELY SKIPPING AUTO-TRIGGER`);
        console.log(`🔍 [DEBUG_EVENTS] Let pending event handler create the battle instead`);
        return;
      }
      
      console.log(`🔍 [DEBUG_EVENTS] ✅ No pending Pokemon - proceeding with auto-trigger`);
      console.log(`🔍 [DEBUG_EVENTS] ✅ Auto-triggering first battle with ${filteredPokemon.length} Pokemon`);
      
      const triggerTimer = setTimeout(() => {
        console.log(`🔍 [DEBUG_EVENTS] Auto-trigger setTimeout executing...`);
        if (startNewBattleCallbackRef.current && currentBattle.length === 0) {
          console.log(`🔍 [DEBUG_EVENTS] 🚀 CALLING startNewBattle for auto-trigger`);
          try {
            const result = startNewBattleCallbackRef.current("pairs");
            console.log(`🔍 [DEBUG_EVENTS] ✅ Auto-trigger result:`, result?.map(p => p.name) || 'null/undefined');
            initialBattleStartedRef.current = true;
          } catch (error) {
            console.error(`🔍 [DEBUG_EVENTS] ❌ Error in auto-trigger:`, error);
          }
        }
      }, 200);

      return () => clearTimeout(triggerTimer);
    } else {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Auto-trigger conditions not met`);
    }
  }, [
    filteredPokemon.length,
    currentBattle.length,
    isHydrated,
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
