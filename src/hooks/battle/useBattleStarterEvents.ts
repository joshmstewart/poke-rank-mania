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
  const eventHandledRef = useRef(false);
  const masterBattleProcessingRef = useRef(false);
  
  const { initiatePendingBattle, setInitiatePendingBattle } = useTrueSkillStore();
  const { getAllPendingIds, removePendingPokemon } = useCloudPendingBattles();

  // MASTER_BATTLE_START: The single authoritative battle coordinator
  useEffect(() => {
    if (masterBattleProcessingRef.current) {
      return;
    }

    // Only proceed if we have Pokemon data and a pending battle is flagged
    if (!allPokemon.length || !initiatePendingBattle) {
      return;
    }

    masterBattleProcessingRef.current = true;
    
    console.log(`🏁 [MASTER_BATTLE_START] Gate locked. Deciding which battle to create.`);
    
    // Get pending Pokemon IDs
    const pendingIds = getAllPendingIds();
    console.log(`🚦 [MASTER_BATTLE_START] Pending IDs available: ${pendingIds}`);
    
    if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
      console.log(`🚦 [MASTER_BATTLE_START] Path chosen: PENDING BATTLE.`);
      
      // Reset the flag first
      setInitiatePendingBattle(false);
      console.log(`🚦 [MODE_COORDINATION] Setting initiatePendingBattle flag to: false`);
      
      // CRITICAL FIX: Actually create the battle from pending IDs
      console.log(`🎯 [MASTER_BATTLE_START] Creating battle from pending IDs: ${pendingIds}`);
      
      // Find pending Pokemon objects
      const pendingPokemon = allPokemon.filter(p => pendingIds.includes(p.id));
      console.log(`🎯 [MASTER_BATTLE_START] Found ${pendingPokemon.length} pending Pokemon objects`);
      
      if (pendingPokemon.length > 0) {
        // Use the first pending Pokemon as primary
        const primaryPokemon = pendingPokemon[0];
        console.log(`🎯 [MASTER_BATTLE_START] Primary Pokemon: ${primaryPokemon.name}(${primaryPokemon.id})`);
        
        // Find an opponent from available Pokemon
        const availableOpponents = allPokemon.filter(p => p.id !== primaryPokemon.id);
        
        if (availableOpponents.length > 0) {
          const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
          console.log(`🎯 [MASTER_BATTLE_START] Opponent: ${opponent.name}(${opponent.id})`);
          
          const pendingBattle = [primaryPokemon, opponent];
          console.log(`✅ [MASTER_BATTLE_START] Creating pending battle: ${primaryPokemon.name} vs ${opponent.name}`);
          
          // Set the battle state
          setCurrentBattle(pendingBattle);
          setSelectedPokemon([]);
          
          // Remove the pending Pokemon after using it
          console.log(`🗑️ [MASTER_BATTLE_START] Removing pending Pokemon: ${primaryPokemon.id}`);
          removePendingPokemon(primaryPokemon.id);
          
          // Also remove opponent if it was pending
          if (pendingIds.includes(opponent.id)) {
            console.log(`🗑️ [MASTER_BATTLE_START] Also removing pending opponent: ${opponent.id}`);
            removePendingPokemon(opponent.id);
          }
          
          initialBattleStartedRef.current = true;
          console.log(`✅ [MASTER_BATTLE_START] Pending battle creation complete!`);
          
        } else {
          console.error(`❌ [MASTER_BATTLE_START] No opponents available for pending battle`);
        }
      } else {
        console.error(`❌ [MASTER_BATTLE_START] No pending Pokemon objects found for IDs: ${pendingIds}`);
      }
    } else {
      console.log(`🚦 [MASTER_BATTLE_START] No pending IDs, falling back to normal battle creation`);
      
      // Reset the flag
      setInitiatePendingBattle(false);
      console.log(`🚦 [MODE_COORDINATION] Setting initiatePendingBattle flag to: false`);
      
      // Use the normal battle creation process
      if (startNewBattleCallbackRef.current) {
        const newBattle = startNewBattleCallbackRef.current("pairs");
        if (newBattle && newBattle.length > 0) {
          setCurrentBattle(newBattle);
          setSelectedPokemon([]);
          initialBattleStartedRef.current = true;
          console.log(`✅ [MASTER_BATTLE_START] Normal battle creation complete!`);
        }
      }
    }
    
    masterBattleProcessingRef.current = false;
    
  }, [
    allPokemon.length, 
    initiatePendingBattle, 
    getAllPendingIds, 
    removePendingPokemon, 
    setInitiatePendingBattle, 
    setCurrentBattle, 
    setSelectedPokemon, 
    startNewBattleCallbackRef, 
    initialBattleStartedRef
  ]);

  // INITIAL_BATTLE_DEBUG: Secondary initialization for non-pending battles
  useEffect(() => {
    if (eventHandledRef.current || initializationCompleteRef.current) {
      return;
    }

    console.log(`🚀 [INITIAL_BATTLE_DEBUG] Effect triggered - Pokemon: ${allPokemon.length}, Battle: ${currentBattle.length}, Started: ${initialBattleStartedRef.current}`);

    // CRITICAL FIX: Check for pending battle flag and defer to Master Battle Starter
    if (initiatePendingBattle) {
      console.log(`🏁 [INITIAL_BATTLE_DEBUG] Deferring to Master Battle Starter for pending battle.`);
      return;
    }

    const pokemonDataAvailable = allPokemon.length > 0;
    const isBattleActive = currentBattle.length > 0;
    const initialStarted = initialBattleStartedRef.current;

    if (pokemonDataAvailable && !isBattleActive && !initialStarted) {
      console.log(`🚀 [INITIAL_BATTLE_DEBUG] Starting initial RANDOM battle...`);
      
      if (startNewBattleCallbackRef.current) {
        const newBattle = startNewBattleCallbackRef.current("pairs");
        if (newBattle && newBattle.length > 0) {
          setCurrentBattle(newBattle);
          setSelectedPokemon([]);
          initialBattleStartedRef.current = true;
          eventHandledRef.current = true;
          console.log(`✅ [INITIAL_BATTLE_DEBUG] Initial battle created successfully!`);
        } else {
          console.error(`❌ [INITIAL_BATTLE_DEBUG] Failed to create initial battle`);
        }
      }
    }
  }, [
    allPokemon.length, 
    currentBattle.length, 
    initialBattleStartedRef, 
    startNewBattleCallbackRef, 
    setCurrentBattle, 
    setSelectedPokemon, 
    initiatePendingBattle
  ]);

  // Mode switch event listener
  useEffect(() => {
    const handleModeSwitch = (event: any) => {
      const { mode, timestamp } = event.detail;
      console.log(`🔄 [MODE_SWITCH_HANDLER] Mode switched to: ${mode} at ${timestamp}`);
      
      if (mode === 'battle') {
        console.log(`🚦 [MODE_COORDINATION] Entering battle mode, checking for pending battles`);
        
        const pendingIds = getAllPendingIds();
        if (pendingIds && Array.isArray(pendingIds) && pendingIds.length > 0) {
          console.log(`🚦 [MODE_COORDINATION] Found pending battles: ${pendingIds}`);
          console.log(`🚦 [MODE_COORDINATION] Setting initiatePendingBattle flag to: true`);
          setInitiatePendingBattle(true);
        } else {
          console.log(`🚦 [MODE_COORDINATION] No pending battles found`);
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
      eventHandledRef.current = false;
      initialBattleStartedRef.current = false;
      initializationCompleteRef.current = false;
      masterBattleProcessingRef.current = false;
    }
  }, [allPokemon.length]);
};
