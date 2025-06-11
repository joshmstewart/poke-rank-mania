
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

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
  
  const { initiatePendingBattle, setInitiatePendingBattle } = useTrueSkillStore();
  const { getAllPendingIds, removePendingPokemon } = useCloudPendingBattles();

  // SINGLE AUTHORITATIVE BATTLE CREATOR - handles both pending and normal battles
  useEffect(() => {
    // Prevent multiple simultaneous battle creation attempts
    if (battleCreationInProgressRef.current) {
      console.log(`🔒 [SINGLE_BATTLE_CREATOR] Battle creation already in progress - skipping`);
      return;
    }

    // Only create battles when we have Pokemon data
    if (!allPokemon.length) {
      console.log(`🔒 [SINGLE_BATTLE_CREATOR] No Pokemon data - waiting`);
      return;
    }

    // Don't create multiple battles
    if (currentBattle.length > 0) {
      console.log(`🔒 [SINGLE_BATTLE_CREATOR] Battle already exists - skipping`);
      return;
    }

    // Don't create battle if already started
    if (initialBattleStartedRef.current) {
      console.log(`🔒 [SINGLE_BATTLE_CREATOR] Initial battle already started - skipping`);
      return;
    }

    console.log(`🚀 [SINGLE_BATTLE_CREATOR] Starting battle creation process`);
    battleCreationInProgressRef.current = true;
    
    try {
      // STEP 1: Check for pending Pokemon FIRST
      const pendingIds = getAllPendingIds();
      console.log(`🎯 [SINGLE_BATTLE_CREATOR] Checking pending IDs: ${pendingIds}`);
      
      if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
        console.log(`🎯 [SINGLE_BATTLE_CREATOR] Creating PENDING battle`);
        
        const pendingPokemon = allPokemon.filter(p => pendingIds.includes(p.id));
        
        if (pendingPokemon.length > 0) {
          const primaryPokemon = pendingPokemon[0];
          const availableOpponents = allPokemon.filter(p => p.id !== primaryPokemon.id);
          
          if (availableOpponents.length > 0) {
            const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
            const pendingBattle = [primaryPokemon, opponent];
            
            console.log(`✅ [SINGLE_BATTLE_CREATOR] Created pending battle: ${primaryPokemon.name} vs ${opponent.name}`);
            
            // Set battle state
            setCurrentBattle(pendingBattle);
            setSelectedPokemon([]);
            initialBattleStartedRef.current = true;
            
            // Clean up pending state
            setInitiatePendingBattle(false);
            removePendingPokemon(primaryPokemon.id);
            if (pendingIds.includes(opponent.id)) {
              removePendingPokemon(opponent.id);
            }
            
            battleCreationInProgressRef.current = false;
            return;
          }
        }
        
        console.error(`❌ [SINGLE_BATTLE_CREATOR] Failed to create pending battle`);
        setInitiatePendingBattle(false);
      }
      
      // STEP 2: Create normal battle if no pending battles
      console.log(`🎲 [SINGLE_BATTLE_CREATOR] Creating NORMAL battle`);
      
      if (startNewBattleCallbackRef.current) {
        const newBattle = startNewBattleCallbackRef.current("pairs");
        if (newBattle && newBattle.length > 0) {
          setCurrentBattle(newBattle);
          setSelectedPokemon([]);
          initialBattleStartedRef.current = true;
          console.log(`✅ [SINGLE_BATTLE_CREATOR] Created normal battle`);
        } else {
          console.error(`❌ [SINGLE_BATTLE_CREATOR] Failed to create normal battle`);
        }
      }
      
    } finally {
      battleCreationInProgressRef.current = false;
    }
    
  }, [
    allPokemon.length,
    currentBattle.length,
    initialBattleStartedRef.current,
    initiatePendingBattle,
    getAllPendingIds,
    removePendingPokemon,
    setInitiatePendingBattle,
    setCurrentBattle,
    setSelectedPokemon,
    startNewBattleCallbackRef
  ]);

  // Mode switch event listener - ONLY sets the flag, doesn't create battles
  useEffect(() => {
    const handleModeSwitch = (event: any) => {
      const { mode, timestamp } = event.detail;
      console.log(`🔄 [MODE_SWITCH_HANDLER] Mode switched to: ${mode} at ${timestamp}`);
      
      if (mode === 'battle') {
        console.log(`🚦 [MODE_COORDINATION] Entering battle mode`);
        
        const pendingIds = getAllPendingIds();
        if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
          console.log(`🚦 [MODE_COORDINATION] Found pending battles - setting flag`);
          setInitiatePendingBattle(true);
        }
      }
    };

    document.addEventListener('mode-switch', handleModeSwitch);
    
    return () => {
      document.removeEventListener('mode-switch', handleModeSwitch);
    };
  }, [getAllPendingIds, setInitiatePendingBattle]);

  // Reset refs when Pokemon data changes
  useEffect(() => {
    if (allPokemon.length === 0) {
      initialBattleStartedRef.current = false;
      initializationCompleteRef.current = false;
      battleCreationInProgressRef.current = false;
    }
  }, [allPokemon.length]);
};
