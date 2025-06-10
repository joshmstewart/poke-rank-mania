
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
  // Listen for refinement battles available event from mode switcher
  useEffect(() => {
    const handleRefinementBattlesAvailable = (event: CustomEvent) => {
      console.log(`🎯 [BATTLE_STARTER_EVENTS] ===== REFINEMENT BATTLES AVAILABLE EVENT =====`);
      console.log(`🎯 [BATTLE_STARTER_EVENTS] Event detail:`, event.detail);
      console.log(`🎯 [BATTLE_STARTER_EVENTS] Current battle empty: ${currentBattle.length === 0}`);
      console.log(`🎯 [BATTLE_STARTER_EVENTS] Callback available: ${!!startNewBattleCallbackRef.current}`);
      
      // If we don't have a current battle and we have the callback, trigger a new battle
      if (currentBattle.length === 0 && startNewBattleCallbackRef.current) {
        console.log(`🎯 [BATTLE_STARTER_EVENTS] ✅ Triggering new battle for refinement queue`);
        const result = startNewBattleCallbackRef.current("pairs");
        console.log(`🎯 [BATTLE_STARTER_EVENTS] Battle triggered result:`, result?.map(p => p.name));
      } else {
        console.log(`🎯 [BATTLE_STARTER_EVENTS] ⚠️ Not triggering - current battle exists or no callback`);
      }
    };

    document.addEventListener('refinement-battles-available', handleRefinementBattlesAvailable as EventListener);
    
    return () => {
      document.removeEventListener('refinement-battles-available', handleRefinementBattlesAvailable as EventListener);
    };
  }, [currentBattle.length, startNewBattleCallbackRef]);

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
