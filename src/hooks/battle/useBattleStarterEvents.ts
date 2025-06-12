
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStarterEvents = (
  allPokemon: Pokemon[],
  currentBattle: Pokemon[],
  initialBattleStartedRef: React.MutableRefObject<boolean>,
  autoTriggerDisabledRef: React.MutableRefObject<boolean>,
  startNewBattleCallbackRef: React.MutableRefObject<((battleType: BattleType) => Pokemon[]) | null>,
  initializationTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  initializationCompleteRef: React.MutableRefObject<boolean>,
  setCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: (pokemon: number[]) => void
) => {
  const battleCreationInProgressRef = useRef(false);

  // Optimized battle creator - runs immediately when conditions are met
  useEffect(() => {
    // Prevent multiple simultaneous battle creation attempts
    if (battleCreationInProgressRef.current) {
      return;
    }

    // Only create battles when we have Pokemon data and no current battle
    if (!allPokemon || allPokemon.length === 0) {
      return;
    }

    if (currentBattle.length > 0) {
      return;
    }

    if (initialBattleStartedRef.current) {
      return;
    }

    console.log(`🚀 [OPTIMIZED_EVENTS] Creating initial battle with ${allPokemon.length} Pokemon`);
    battleCreationInProgressRef.current = true;
    
    try {
      // Create battle immediately - no complex pending logic
      if (startNewBattleCallbackRef.current) {
        const newBattle = startNewBattleCallbackRef.current("pairs");
        if (newBattle && newBattle.length > 0) {
          setCurrentBattle(newBattle);
          setSelectedPokemon([]);
          initialBattleStartedRef.current = true;
          console.log(`✅ [OPTIMIZED_EVENTS] Created battle: ${newBattle.map(p => p.name).join(' vs ')}`);
        }
      }
      
    } finally {
      battleCreationInProgressRef.current = false;
    }
    
  }, [
    allPokemon.length > 0 ? allPokemon : null,
    currentBattle.length,
    initialBattleStartedRef.current,
    setCurrentBattle,
    setSelectedPokemon,
    startNewBattleCallbackRef
  ]);

  // Reset refs when Pokemon data changes
  useEffect(() => {
    if (allPokemon.length === 0) {
      initialBattleStartedRef.current = false;
      initializationCompleteRef.current = false;
      battleCreationInProgressRef.current = false;
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    }
  }, [allPokemon.length]);
};
