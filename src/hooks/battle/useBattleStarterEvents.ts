import { useEffect, useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useCloudPendingBattles } from "./useCloudPendingBattles";
import { useTrueSkillStore } from "@/stores/trueskillStore";

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
  const { initiatePendingBattle, setInitiatePendingBattle } = useTrueSkillStore();
  
  console.log(`🔍 [DEBUG_EVENTS] useBattleStarterEvents hook initialized - hydrated: ${isHydrated}`);
  
  const filteredPokemonCountRef = useRef(filteredPokemon.length);
  const currentBattleLengthRef = useRef(currentBattle.length);
  const isHydratedRef = useRef(isHydrated);
  const componentMountedRef = useRef(true);
  
  // Update refs when values change
  filteredPokemonCountRef.current = filteredPokemon.length;
  currentBattleLengthRef.current = currentBattle.length;
  isHydratedRef.current = isHydrated;

  const checkForPendingPokemon = useCallback(() => {
    console.log(`🔍 [DEBUG_EVENTS] ===== checkForPendingPokemon CALLED =====`);
    
    if (!componentMountedRef.current) {
      console.log(`🔍 [DEBUG_EVENTS] ❌ Component unmounted`);
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
      }, 100);
    }
  }, [getAllPendingIds, startNewBattleCallbackRef]);

  // ====================================================================================
  // MASTER BATTLE CREATION EFFECT - SINGLE SOURCE OF TRUTH
  // This replaces both the FLAG_COORDINATION and INITIAL_BATTLE_DEBUG effects
  // ====================================================================================
  useEffect(() => {
    // This is the master gatekeeper. It only runs when the app is ready for its
    // VERY FIRST battle and has not started one yet.
    if (
      !initialBattleStartedRef.current &&
      isHydrated &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current
    ) {
      // --- STEP 1: Lock the gate. ---
      // We are now committed to starting a battle. Set the ref immediately
      // to guarantee this entire block of code never runs again.
      initialBattleStartedRef.current = true;
      console.log('🏁 [MASTER_BATTLE_START] Gate locked. Deciding which battle to create.');

      // --- STEP 2: Decide which path to take. ---
      if (initiatePendingBattle) {
        console.log('🚦 [MASTER_BATTLE_START] Path chosen: PENDING BATTLE.');
        
        // We are handling the pending battle, so reset the flag now.
        setInitiatePendingBattle(false);

        try {
          // This function already knows to prioritize pending Pokemon.
          startNewBattleCallbackRef.current("pairs");
        } catch (error) {
          console.error('❌ Error during master pending battle start:', error);
        }

      } else {
        console.log('🎲 [MASTER_BATTLE_START] Path chosen: RANDOM BATTLE.');
        // If no pending battle is requested, start a normal random one.
        try {
          startNewBattleCallbackRef.current("pairs");
        } catch (error) {
          console.error('❌ Error during master random battle start:', error);
        }
      }
    }
  }, [
    // Dependencies that determine if we are ready for ANY battle
    isHydrated,
    filteredPokemon.length,
    currentBattle.length,
    initiatePendingBattle, // This is needed to re-evaluate if the flag changes
    setInitiatePendingBattle
  ]);

  // Event listeners for manual starring (when already in battle mode)
  useEffect(() => {
    console.log(`🔍 [DEBUG_EVENTS] Setting up event listeners`);
    componentMountedRef.current = true;
    
    const handlePokemonStarred = (event: CustomEvent) => {
      console.log(`🔍 [DEBUG_EVENTS] POKEMON STARRED EVENT`);
      if (componentMountedRef.current) {
        checkForPendingPokemon();
      }
    };

    document.addEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    
    return () => {
      console.log(`🔍 [DEBUG_EVENTS] Removing event listeners`);
      componentMountedRef.current = false;
      document.removeEventListener('pokemon-starred-for-battle', handlePokemonStarred as EventListener);
    };
  }, [checkForPendingPokemon]);

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
