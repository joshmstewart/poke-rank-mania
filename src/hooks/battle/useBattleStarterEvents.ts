
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

  // SIMPLIFIED: Single battle creator that runs once when conditions are met
  useEffect(() => {
    // Prevent multiple simultaneous battle creation attempts
    if (battleCreationInProgressRef.current) {
      console.log(`🔒 [BATTLE_CREATOR_SIMPLIFIED] Battle creation already in progress - skipping`);
      return;
    }

    // Only create battles when we have Pokemon data and no current battle
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`🔒 [BATTLE_CREATOR_SIMPLIFIED] No Pokemon data available yet`);
      return;
    }

    if (currentBattle.length > 0) {
      console.log(`🔒 [BATTLE_CREATOR_SIMPLIFIED] Battle already exists - skipping`);
      return;
    }

    if (initialBattleStartedRef.current) {
      console.log(`🔒 [BATTLE_CREATOR_SIMPLIFIED] Initial battle already started - skipping`);
      return;
    }

    console.log(`🚀 [BATTLE_CREATOR_SIMPLIFIED] Creating initial battle with ${allPokemon.length} Pokemon`);
    battleCreationInProgressRef.current = true;
    
    try {
      // SIMPLIFIED: Just create a random battle without complex pending logic
      if (startNewBattleCallbackRef.current) {
        const newBattle = startNewBattleCallbackRef.current("pairs");
        if (newBattle && newBattle.length > 0) {
          setCurrentBattle(newBattle);
          setSelectedPokemon([]);
          initialBattleStartedRef.current = true;
          console.log(`✅ [BATTLE_CREATOR_SIMPLIFIED] Created battle: ${newBattle.map(p => p.name).join(' vs ')}`);
        } else {
          console.error(`❌ [BATTLE_CREATOR_SIMPLIFIED] Failed to create battle`);
        }
      }
      
    } finally {
      battleCreationInProgressRef.current = false;
    }
    
  }, [
    allPokemon.length > 0 ? allPokemon : null, // Only depend on Pokemon when we have them
    currentBattle.length,
    initialBattleStartedRef.current,
    setCurrentBattle,
    setSelectedPokemon,
    startNewBattleCallbackRef
  ]);

  // Reset refs when Pokemon data changes
  useEffect(() => {
    if (allPokemon.length === 0) {
      console.log(`🔄 [BATTLE_CREATOR_SIMPLIFIED] Pokemon data cleared - resetting refs`);
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
