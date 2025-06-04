
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";

export const useBattleStarterEvents = (
  allPokemon: Pokemon[],
  currentBattle: Pokemon[] | undefined,
  initialBattleStartedRef: React.MutableRefObject<boolean>,
  autoTriggerDisabledRef: React.MutableRefObject<boolean>,
  startNewBattleCallbackRef: React.MutableRefObject<((battleType: any) => any[]) | null>,
  initializationTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  initializationCompleteRef: React.MutableRefObject<boolean>,
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // CRITICAL FIX: Start initial battle when Pokemon data is available - but only once
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [DEBUG] useBattleStarterEvents Pokemon data check: ${allPokemon?.length || 0} Pokemon available`);
    console.log(`🔍 [DEBUG] allPokemon type:`, typeof allPokemon);
    console.log(`🔍 [DEBUG] allPokemon is array:`, Array.isArray(allPokemon));
    
    if (!allPokemon) {
      console.log(`🔍 [DEBUG] allPokemon is null/undefined`);
      return;
    }
    
    if (!Array.isArray(allPokemon)) {
      console.log(`🔍 [DEBUG] allPokemon is not an array:`, allPokemon);
      return;
    }
    
    // CRITICAL FIX: Only start initial battle if we have Pokemon AND haven't started yet AND no current battle exists
    if (allPokemon.length > 0 && !initialBattleStartedRef.current && (!currentBattle || currentBattle.length === 0)) {
      console.log(`[${timestamp}] Starting initial battle with ${allPokemon.length} Pokemon`);
      initialBattleStartedRef.current = true;
      
      // Start initial battle after short delay to ensure all systems are ready
      setTimeout(() => {
        if (!autoTriggerDisabledRef.current && (!currentBattle || currentBattle.length === 0)) {
          console.log(`[${timestamp}] Triggering initial battle start`);
          if (startNewBattleCallbackRef.current) {
            const initialBattle = startNewBattleCallbackRef.current("pairs");
            if (initialBattle && initialBattle.length > 0) {
              console.log(`✅ [INITIAL_BATTLE] Generated battle: ${initialBattle.map(p => p.name).join(', ')}`);
              // CRITICAL FIX: Set the battle immediately
              setCurrentBattle(initialBattle);
              setSelectedPokemon([]);
            }
          }
        } else {
          console.log(`[${timestamp}] Skipping initial battle - auto-triggers disabled or battle already exists`);
        }
      }, 500);
    } else {
      console.log(`[${timestamp}] Skipping initial battle trigger - initialBattleStartedRef.current: ${initialBattleStartedRef.current}, currentBattle.length: ${currentBattle?.length || 0}`);
    }
  }, [allPokemon && allPokemon.length > 0 ? 1 : 0, currentBattle?.length, setCurrentBattle, setSelectedPokemon]); // CRITICAL FIX: Only depend on whether we HAVE Pokemon, not the exact count

  // CRITICAL FIX: Simplified initialization
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [DEBUG] useBattleStarterEvents initialized with ${allPokemon?.length || 0} Pokémon`);
    
    if (initializationTimerRef.current) {
      clearTimeout(initializationTimerRef.current);
    }
    
    initializationTimerRef.current = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] useBattleStarterEvents initialization complete`);
      initializationCompleteRef.current = true;
    }, 100);
    
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, []); // CRITICAL FIX: Empty dependency array - only run once
};
