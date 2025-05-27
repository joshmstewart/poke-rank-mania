
import { useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useBattleStarterState } from "./useBattleStarterState";
import { useBattleStarterEvents } from "./useBattleStarterEvents";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[] = [],
  currentRankings: RankedPokemon[] = [],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionFullyUsed?: (pokemon: RankedPokemon, fullyUsed: boolean) => void,
  currentBattle?: Pokemon[]
) => {
  const { battleStarter } = useBattleStarterCore(allPokemon, currentRankings);
  
  const {
    battleGenerationInProgressRef,
    initializationCompleteRef,
    autoTriggerDisabledRef,
    initialBattleStartedRef,
    startNewBattleCallbackRef,
    battleTransitionCountRef,
    initializationTimerRef,
    resetSuggestionPriorityExplicitly
  } = useBattleStarterState();

  // Handle events
  useBattleStarterEvents(
    allPokemon,
    currentBattle,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    startNewBattleCallbackRef,
    initializationTimerRef,
    initializationCompleteRef,
    setCurrentBattle,
    setSelectedPokemon
  );

  const startNewBattle = useCallback((battleType: BattleType) => {
    // CRITICAL FIX: Enhanced logging for battle 10-11 transition
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    
    if (currentBattleCount === 10) {
      console.error(`🔥 [BATTLE_10_11_FIX] CRITICAL: Battle 10->11 transition starting`);
      console.error(`🔥 [BATTLE_10_11_FIX] Current battle before clearing: ${currentBattle?.map(p => p.name).join(' vs ') || 'none'}`);
    }
    
    const isInitialBattle = !initialBattleStartedRef.current || (!currentBattle || currentBattle.length === 0);
    
    if (autoTriggerDisabledRef.current && !isInitialBattle) {
      console.log('[AUTO_TRIGGER_PREVENTION] Auto-trigger disabled - ignoring non-initial battle request');
      return [];
    }
    
    battleTransitionCountRef.current++;
    const transitionId = battleTransitionCountRef.current;
    
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Starting battle generation`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: No Pokemon data available`);
      return [];
    }
    
    if (!initializationCompleteRef.current) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Initialization not complete`);
      return [];
    }
    
    if (battleGenerationInProgressRef.current) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Battle generation already in progress`);
      return [];
    }
    
    battleGenerationInProgressRef.current = true;
    
    try {
      // Generate new battle
      const battle = battleStarter.startNewBattle(battleType, false, false);
      
      if (!battle || battle.length === 0) {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Battle generation failed`);
        return [];
      }

      const battleIds = battle.map(p => p.id);
      
      if (currentBattleCount === 10) {
        console.error(`🔥 [BATTLE_10_11_FIX] Generated battle 11: ${battle.map(p => p.name).join(' vs ')}`);
        console.error(`🔥 [BATTLE_10_11_FIX] Battle IDs: [${battleIds.join(', ')}]`);
      }
      
      // CRITICAL FIX: Return battle immediately without setting it here
      // Let the caller handle setting the battle to prevent race conditions
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ SUCCESS: Battle generated, returning to caller`);
      
      return battle;

    } catch (error) {
      console.error(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ ERROR:`, error);
      return [];
    } finally {
      battleGenerationInProgressRef.current = false;
    }
  }, [
    battleStarter,
    allPokemon.length,
    currentBattle?.length
  ]);

  // Update the ref whenever startNewBattle changes
  useEffect(() => {
    startNewBattleCallbackRef.current = startNewBattle;
    console.log('[DEBUG useBattleStarterIntegration] Updated startNewBattleCallbackRef with new function');
  }, [startNewBattle]);

  const performEmergencyReset = useBattleEmergencyReset(
    [] as Pokemon[],
    setCurrentBattle,
    allPokemon,
    undefined,
    undefined,
    undefined,
    setSelectedPokemon
  );

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: () => {
      resetSuggestionPriorityExplicitly();
    },
    performEmergencyReset
  };
};
