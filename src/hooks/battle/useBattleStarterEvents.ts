
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarterEvents = (
  filteredPokemon: Pokemon[],
  currentBattle: Pokemon[],
  initialBattleStartedRef: React.MutableRefObject<boolean>,
  autoTriggerDisabledRef: React.MutableRefObject<boolean>,
  startNewBattleCallbackRef: React.MutableRefObject<((battleType: any) => Pokemon[]) | null>,
  initializationTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  initializationCompleteRef: React.MutableRefObject<boolean>,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  stableSetSelectedPokemon: (pokemon: number[]) => void
) => {
  const hookId = useRef(`BATTLE_EVENTS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  console.log(`🎯🎯🎯 [${hookId.current}] useBattleStarterEvents hook initialized`);

  // Listen for pending battles detected from mode switcher
  useEffect(() => {
    const handlePendingBattlesDetected = (event: CustomEvent) => {
      const eventId = `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] ===== PENDING BATTLES EVENT RECEIVED =====`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Event detail:`, event.detail);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Event timing: ${event.detail?.timing || 'unknown'}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Source debug ID: ${event.detail?.debugId || 'none'}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Current battle length: ${currentBattle.length}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Callback available: ${!!startNewBattleCallbackRef.current}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Filtered Pokemon count: ${filteredPokemon.length}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Auto trigger disabled: ${autoTriggerDisabledRef.current}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Initial battle started: ${initialBattleStartedRef.current}`);
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Initialization complete: ${initializationCompleteRef.current}`);
      
      // FORCE trigger if this is from mode switcher
      const shouldForceStart = event.detail?.immediate === true || event.detail?.source === 'mode-switcher-cloud';
      
      console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Should force start: ${shouldForceStart}`);
      
      if (shouldForceStart && startNewBattleCallbackRef.current && filteredPokemon.length > 0) {
        console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] ✅ CONDITIONS MET - TRIGGERING NEW BATTLE`);
        
        // Set all flags to ensure this works
        autoTriggerDisabledRef.current = true;
        initialBattleStartedRef.current = true;
        initializationCompleteRef.current = true;
        
        console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Flags set - calling startNewBattleCallback`);
        
        try {
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] ✅ Battle callback result:`, result?.map(p => `${p.name}(${p.id})`));
          
          if (result && result.length > 0) {
            console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Setting current battle and clearing selected Pokemon`);
            stableSetCurrentBattle(result);
            stableSetSelectedPokemon([]);
            console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] ✅ Battle set successfully - ${result.map(p => p.name).join(' vs ')}`);
            
            // Check if any of the pending Pokemon are in this battle
            const pendingIds = event.detail?.pendingPokemon || [];
            const battleIds = result.map(p => p.id);
            const hasPendingInBattle = pendingIds.some((id: number) => battleIds.includes(id));
            
            if (hasPendingInBattle) {
              console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] 🎯 SUCCESS! Pending Pokemon found in battle!`);
              console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Pending IDs: ${pendingIds}`);
              console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Battle IDs: ${battleIds}`);
            } else {
              console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] ⚠️ No pending Pokemon in this battle`);
              console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Pending IDs: ${pendingIds}`);
              console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] Battle IDs: ${battleIds}`);
            }
          } else {
            console.error(`🎯🎯🎯 [${hookId.current}][${eventId}] ❌ Battle callback returned empty/null result`);
          }
        } catch (error) {
          console.error(`🎯🎯🎯 [${hookId.current}][${eventId}] ❌ Error calling battle callback:`, error);
        }
      } else {
        console.log(`🎯🎯🎯 [${hookId.current}][${eventId}] ⚠️ Not triggering battle:`, {
          shouldForceStart,
          immediate: event.detail?.immediate,
          source: event.detail?.source,
          callbackAvailable: !!startNewBattleCallbackRef.current,
          filteredPokemonCount: filteredPokemon.length,
          autoTriggerDisabled: autoTriggerDisabledRef.current
        });
      }
    };

    console.log(`🎯🎯🎯 [${hookId.current}] Setting up pending-battles-detected event listener`);
    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    
    return () => {
      console.log(`🎯🎯🎯 [${hookId.current}] Removing pending-battles-detected event listener`);
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    };
  }, [currentBattle.length, startNewBattleCallbackRef, stableSetCurrentBattle, stableSetSelectedPokemon, filteredPokemon.length]);

  // Listen for pokemon starred events
  useEffect(() => {
    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`🎯🎯🎯 [${hookId.current}] ===== POKEMON STARRED EVENT RECEIVED =====`);
      console.log(`🎯🎯🎯 [${hookId.current}] Event detail:`, event.detail);
    };

    console.log(`🎯🎯🎯 [${hookId.current}] Setting up pokemon-starred-for-battle event listener`);
    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      console.log(`🎯🎯🎯 [${hookId.current}] Removing pokemon-starred-for-battle event listener`);
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, []);

  // Auto-trigger initialization when Pokemon are loaded (existing logic) - but respect disabled flag
  useEffect(() => {
    if (
      filteredPokemon.length > 0 && 
      currentBattle.length === 0 && 
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      !initializationCompleteRef.current
    ) {
      console.log(`🎯🎯🎯 [${hookId.current}] Setting up auto-initialization timer - ${filteredPokemon.length} Pokemon available`);
      
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
      
      initializationTimerRef.current = setTimeout(() => {
        if (
          filteredPokemon.length > 0 && 
          currentBattle.length === 0 && 
          !initialBattleStartedRef.current &&
          !autoTriggerDisabledRef.current &&
          startNewBattleCallbackRef.current
        ) {
          console.log(`🎯🎯🎯 [${hookId.current}] ✅ Auto-triggering initial battle`);
          initialBattleStartedRef.current = true;
          initializationCompleteRef.current = true;
          
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(`🎯🎯🎯 [${hookId.current}] Auto-trigger battle result:`, result?.map(p => p.name));
        }
      }, 2000);
    }

    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    };
  }, [
    filteredPokemon.length,
    currentBattle.length,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    startNewBattleCallbackRef,
    initializationCompleteRef
  ]);
};
