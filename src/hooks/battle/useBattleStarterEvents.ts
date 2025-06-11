
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
  
  const filteredPokemonCountRef = useRef(filteredPokemon.length);
  const currentBattleLengthRef = useRef(currentBattle.length);
  const isHydratedRef = useRef(isHydrated);
  const componentMountedRef = useRef(true);
  const eventProcessingRef = useRef(false); // Prevent duplicate event processing
  
  // Update refs when values change
  filteredPokemonCountRef.current = filteredPokemon.length;
  currentBattleLengthRef.current = currentBattle.length;
  isHydratedRef.current = isHydrated;

  const checkForPendingPokemon = useCallback(() => {
    console.log(`🔍 [DEBUG_EVENTS] ===== checkForPendingPokemon CALLED =====`);
    
    if (!componentMountedRef.current || eventProcessingRef.current) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Component unmounted or already processing`);
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
      
      // Prevent duplicate processing
      eventProcessingRef.current = true;
      
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
        
        // Reset processing flag after attempt
        setTimeout(() => {
          eventProcessingRef.current = false;
        }, 1000);
      }, 100);
    }
  }, [getAllPendingIds, startNewBattleCallbackRef]);

  // Event listeners with improved handling
  useEffect(() => {
    console.log(`🔍 [DEBUG_EVENTS] Setting up event listeners`);
    componentMountedRef.current = true;
    
    const handlePendingBattlesDetected = (event: CustomEvent) => {
      const eventId = `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] PENDING BATTLES DETECTED EVENT`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Event detail:`, event.detail);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Component mounted: ${componentMountedRef.current}`);
      console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Processing: ${eventProcessingRef.current}`);
      
      if (componentMountedRef.current && !eventProcessingRef.current) {
        console.log(`🔍 [DEBUG_EVENTS] [${eventId}] Calling checkForPendingPokemon`);
        checkForPendingPokemon();
      }
    };

    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`🔍 [DEBUG_EVENTS] POKEMON STARRED EVENT`);
      if (componentMountedRef.current && !eventProcessingRef.current) {
        checkForPendingPokemon();
      }
    };

    const handleForceCheck = (event: CustomEvent) => {
      console.log(`🔍 [DEBUG_EVENTS] FORCE CHECK EVENT`);
      if (componentMountedRef.current) {
        // Force check can override processing flag
        eventProcessingRef.current = false;
        checkForPendingPokemon();
      }
    };

    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    document.addEventListener('force-pending-battle-check', handleForceCheck as EventListener);
    
    return () => {
      console.log(`🔍 [DEBUG_EVENTS] Removing event listeners`);
      componentMountedRef.current = false;
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
      document.removeEventListener('force-pending-battle-check', handleForceCheck as EventListener);
    };
  }, [checkForPendingPokemon]);

  // Initial pending check
  useEffect(() => {
    if (componentMountedRef.current && isHydrated && filteredPokemon.length > 0 && currentBattle.length === 0) {
      console.log(`🔍 [DEBUG_EVENTS] Initial pending check`);
      setTimeout(() => {
        if (componentMountedRef.current) {
          checkForPendingPokemon();
        }
      }, 500);
    }
  }, [isHydrated, filteredPokemon.length, currentBattle.length, checkForPendingPokemon]);

  // Auto-trigger for normal battles (only when no pending Pokemon)
  useEffect(() => {
    if (
      componentMountedRef.current &&
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current &&
      isHydrated
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
  }, [filteredPokemon.length, currentBattle.length, isHydrated, getAllPendingIds]);

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
