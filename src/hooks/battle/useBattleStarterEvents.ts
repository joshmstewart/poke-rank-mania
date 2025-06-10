
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
  // Listen for pending battles detected from mode switcher
  useEffect(() => {
    const handlePendingBattlesDetected = (event: CustomEvent) => {
      console.log(`🔍 [BATTLE_EVENT_DEBUG] ===== PENDING BATTLES EVENT RECEIVED =====`);
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Event detail:`, event.detail);
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Current battle length: ${currentBattle.length}`);
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Callback available: ${!!startNewBattleCallbackRef.current}`);
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Filtered Pokemon count: ${filteredPokemon.length}`);
      
      // CRITICAL FIX: Force trigger even if we have a current battle if this is immediate
      const shouldForceStart = event.detail?.immediate === true || currentBattle.length === 0;
      
      if (shouldForceStart && startNewBattleCallbackRef.current) {
        console.log(`🔍 [BATTLE_EVENT_DEBUG] ✅ Conditions met - triggering new battle (force: ${event.detail?.immediate})`);
        
        // Disable auto-trigger since we're manually triggering
        autoTriggerDisabledRef.current = true;
        initialBattleStartedRef.current = true;
        initializationCompleteRef.current = true;
        
        try {
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(`🔍 [BATTLE_EVENT_DEBUG] ✅ Battle callback result:`, result?.map(p => p.name));
          
          if (result && result.length > 0) {
            stableSetCurrentBattle(result);
            stableSetSelectedPokemon([]);
            console.log(`🔍 [BATTLE_EVENT_DEBUG] ✅ Battle set successfully - ${result.map(p => p.name).join(' vs ')}`);
            
            // Check if any of the pending Pokemon are in this battle
            const pendingIds = event.detail?.pendingPokemon || [];
            const battleIds = result.map(p => p.id);
            const hasPendingInBattle = pendingIds.some((id: number) => battleIds.includes(id));
            
            if (hasPendingInBattle) {
              console.log(`🔍 [BATTLE_EVENT_DEBUG] 🎯 SUCCESS! Pending Pokemon found in battle!`);
            } else {
              console.log(`🔍 [BATTLE_EVENT_DEBUG] ⚠️ No pending Pokemon in this battle - may be processed later`);
            }
          } else {
            console.error(`🔍 [BATTLE_EVENT_DEBUG] ❌ Battle callback returned empty/null result`);
          }
        } catch (error) {
          console.error(`🔍 [BATTLE_EVENT_DEBUG] ❌ Error calling battle callback:`, error);
        }
      } else {
        console.log(`🔍 [BATTLE_EVENT_DEBUG] ⚠️ Not triggering battle:`, {
          shouldForceStart,
          immediate: event.detail?.immediate,
          currentBattleExists: currentBattle.length > 0,
          callbackAvailable: !!startNewBattleCallbackRef.current
        });
      }
    };

    console.log(`🔍 [BATTLE_EVENT_DEBUG] Setting up pending-battles-detected event listener`);
    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    
    return () => {
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Removing pending-battles-detected event listener`);
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    };
  }, [currentBattle.length, startNewBattleCallbackRef, stableSetCurrentBattle, stableSetSelectedPokemon, filteredPokemon.length]);

  // Listen for pokemon starred events
  useEffect(() => {
    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`🔍 [BATTLE_EVENT_DEBUG] ===== POKEMON STARRED EVENT RECEIVED =====`);
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Event detail:`, event.detail);
    };

    console.log(`🔍 [BATTLE_EVENT_DEBUG] Setting up pokemon-starred-for-battle event listener`);
    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Removing pokemon-starred-for-battle event listener`);
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
      console.log(`🔍 [BATTLE_EVENT_DEBUG] Setting up auto-initialization timer - ${filteredPokemon.length} Pokemon available`);
      
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
          console.log(`🔍 [BATTLE_EVENT_DEBUG] ✅ Auto-triggering initial battle`);
          initialBattleStartedRef.current = true;
          initializationCompleteRef.current = true;
          
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(`🔍 [BATTLE_EVENT_DEBUG] Auto-trigger battle result:`, result?.map(p => p.name));
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
