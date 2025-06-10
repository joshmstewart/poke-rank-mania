
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
      console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] ===== PENDING BATTLES DETECTED =====`);
      console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] Event detail:`, event.detail);
      console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] Current battle empty: ${currentBattle.length === 0}`);
      console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] Callback available: ${!!startNewBattleCallbackRef.current}`);
      
      // If we don't have a current battle and we have the callback, trigger a new battle
      if (currentBattle.length === 0 && startNewBattleCallbackRef.current) {
        console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] ✅ Triggering new battle for pending Pokemon`);
        const result = startNewBattleCallbackRef.current("pairs");
        console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] Battle triggered result:`, result?.map(p => p.name));
        
        if (result && result.length > 0) {
          stableSetCurrentBattle(result);
          stableSetSelectedPokemon([]);
          console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] ✅ Battle set successfully`);
        }
      } else {
        console.log(`⚡⚡⚡ [BATTLE_STARTER_EVENTS] ⚠️ Not triggering - current battle exists or no callback`);
      }
    };

    document.addEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    
    return () => {
      document.removeEventListener('pending-battles-detected', handlePendingBattlesDetected as EventListener);
    };
  }, [currentBattle.length, startNewBattleCallbackRef, stableSetCurrentBattle, stableSetSelectedPokemon]);

  // Listen for pokemon starred events
  useEffect(() => {
    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`⭐⭐⭐ [BATTLE_STARTER_EVENTS] Pokemon starred event received:`, event.detail);
    };

    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, []);

  // Auto-trigger initialization when Pokemon are loaded (existing logic)
  useEffect(() => {
    if (
      filteredPokemon.length > 0 && 
      currentBattle.length === 0 && 
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      !initializationCompleteRef.current
    ) {
      console.log(`🎯 [BATTLE_STARTER_EVENTS] Setting up initialization timer - ${filteredPokemon.length} Pokemon available`);
      
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
      
      initializationTimerRef.current = setTimeout(() => {
        if (
          filteredPokemon.length > 0 && 
          currentBattle.length === 0 && 
          !initialBattleStartedRef.current &&
          startNewBattleCallbackRef.current
        ) {
          console.log(`🎯 [BATTLE_STARTER_EVENTS] ✅ Auto-triggering initial battle`);
          initialBattleStartedRef.current = true;
          initializationCompleteRef.current = true;
          
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(`🎯 [BATTLE_STARTER_EVENTS] Initial battle result:`, result?.map(p => p.name));
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
