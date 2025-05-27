import { useMemo, useEffect, useRef, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { toast } from "@/hooks/use-toast";

// Helper to compare battles
const areBattlesIdentical = (battle1: Pokemon[], battle2: number[]) => {
  if (!battle1 || !battle2 || battle1.length !== battle2.length) return false;
  const battle1Ids = battle1.map(p => p.id);
  return battle1Ids.every(id => battle2.includes(id)) && 
         battle2.every(id => battle1Ids.includes(id));
};

// Define extended interface for the battleStarter object that includes getSuggestions
interface ExtendedBattleStarter {
  startNewBattle: (battleType: BattleType, forceSuggestion?: boolean, forceUnranked?: boolean) => Pokemon[];
  trackLowerTierLoss: (loserId: number) => void;
  getSuggestions: () => RankedPokemon[];
}

// CRITICAL FIX: Create default empty ExtendedBattleStarter for safe initialization
const createEmptyBattleStarter = (): ExtendedBattleStarter => ({
  startNewBattle: () => {
    console.warn('[BattleStarter NO_DATA] startNewBattle called but no Pokémon data was available on creation.');
    return [];
  },
  trackLowerTierLoss: () => {},
  getSuggestions: () => []
});

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[] = [],
  currentRankings: RankedPokemon[] = [],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionFullyUsed?: (pokemon: RankedPokemon, fullyUsed: boolean) => void,
  currentBattle?: Pokemon[]
) => {
  // CRITICAL FIX: Single global battleStarter instance - NEVER recreate
  const battleStarterInstanceRef = useRef<ExtendedBattleStarter | null>(null);
  const battleStarterCreatedRef = useRef(false);
  const initialBattleStartedRef = useRef(false);
  
  // Initialize refs with appropriate default values
  const processedSuggestionBattlesRef = useRef<Set<number>>(new Set());
  const suggestionBattleCountRef = useRef(0);
  const forcedPriorityBattlesRef = useRef(0);
  const totalSuggestionsRef = useRef(0);
  const milestoneCrossedRef = useRef(false);
  const priorityModeActiveRef = useRef(false);
  const consecutiveBattlesWithoutNewPokemonRef = useRef(0);
  const previousBattleIds = useRef<number[]>([]);
  const identicalBattleCount = useRef(0);
  const battleGenerationInProgressRef = useRef(false);
  const initializationCompleteRef = useRef(false);
  const initialGetBattleFiredRef = useRef(false);
  const initializationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // CRITICAL FIX: Enhanced auto-trigger control with milestone coordination
  const autoTriggerDisabledRef = useRef(false);
  
  // Add ref to hold the latest startNewBattle callback
  const startNewBattleCallbackRef = useRef<((battleType: BattleType) => Pokemon[]) | null>(null);
  
  // CRITICAL: Add a ref to track the last successfully set battle to avoid duplicate event handling
  const lastSetBattleIdsRef = useRef<number[]>([]);
  
  // NEW: Add battle transition debugging counter
  const battleTransitionCountRef = useRef(0);

  // CRITICAL FIX: Create battleStarter exactly ONCE and store it permanently
  const battleStarter = useMemo<ExtendedBattleStarter>(() => {
    console.log('[CRITICAL FIX] battleStarter useMemo - battleStarterCreatedRef.current:', battleStarterCreatedRef.current);
    
    // If battleStarter already exists, return it immediately - NEVER recreate
    if (battleStarterCreatedRef.current && battleStarterInstanceRef.current) {
      console.log('[CRITICAL FIX] Returning existing battleStarter instance - Pokemon count changes will NOT recreate');
      return battleStarterInstanceRef.current;
    }

    if (!allPokemon || allPokemon.length === 0) {
      console.log("[CRITICAL FIX] No Pokémon data available, returning empty battleStarter");
      return createEmptyBattleStarter();
    }

    console.log(`[CRITICAL FIX] Creating battleStarter PERMANENTLY with ${allPokemon.length} Pokémon`);
    
    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );

    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    
    const battleStarterInstance = createBattleStarter(
      allPokemon,
      currentRankings
    );
    
    const extendedInstance: ExtendedBattleStarter = {
      startNewBattle: battleStarterInstance.startNewBattle,
      trackLowerTierLoss: battleStarterInstance.trackLowerTierLoss,
      getSuggestions: () => {
        return (currentRankings || []).filter(
          p => p.suggestedAdjustment && !p.suggestedAdjustment.used
        );
      }
    };

    // CRITICAL FIX: Store the instance permanently and mark as created
    battleStarterInstanceRef.current = extendedInstance;
    battleStarterCreatedRef.current = true;
    
    console.log("[CRITICAL FIX] BattleStarter created PERMANENTLY - will NEVER be recreated");
    
    return extendedInstance;
  }, [allPokemon.length > 0 ? 'HAS_POKEMON' : 'NO_POKEMON']); // CRITICAL: Only depend on whether we have Pokemon at all

  // CRITICAL FIX: Start initial battle when Pokemon data is available - but only once
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration Pokemon data check: ${allPokemon?.length || 0} Pokemon available`);
    
    // CRITICAL FIX: Only start initial battle if we have Pokemon AND haven't started yet AND no current battle exists
    if (allPokemon && allPokemon.length > 0 && !initialBattleStartedRef.current && (!currentBattle || currentBattle.length === 0)) {
      console.log(`[${timestamp}] Starting initial battle with ${allPokemon.length} Pokemon`);
      initialBattleStartedRef.current = true;
      
      // Start initial battle after short delay to ensure all systems are ready
      setTimeout(() => {
        if (!autoTriggerDisabledRef.current && (!currentBattle || currentBattle.length === 0)) {
          console.log(`[${timestamp}] Triggering initial battle start`);
          if (startNewBattleCallbackRef.current) {
            const initialBattle = startNewBattleCallbackRef.current("pairs");
            if (initialBattle && initialBattle.length > 0) {
              console.log(`✅ [INITIAL_BATTLE] Started with Pokemon: ${initialBattle.map(p => p.name).join(', ')}`);
            }
          }
        } else {
          console.log(`[${timestamp}] Skipping initial battle - auto-triggers disabled or battle already exists`);
        }
      }, 500);
    } else {
      console.log(`[${timestamp}] Skipping initial battle trigger - initialBattleStartedRef.current: ${initialBattleStartedRef.current}, currentBattle.length: ${currentBattle?.length || 0}`);
    }
  }, [allPokemon.length > 0 ? 1 : 0, currentBattle?.length]); // CRITICAL FIX: Only depend on whether we HAVE Pokemon, not the exact count

  // CRITICAL FIX: Simplified initialization
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration initialized with ${allPokemon?.length || 0} Pokémon`);
    
    if (initializationTimerRef.current) {
      clearTimeout(initializationTimerRef.current);
    }
    
    initializationTimerRef.current = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] useBattleStarterIntegration initialization complete`);
      initializationCompleteRef.current = true;
    }, 100);
    
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, []); // CRITICAL FIX: Empty dependency array - only run once

  const startNewBattle = useCallback((battleType: BattleType) => {
    // CRITICAL FIX: Clear previous battle IMMEDIATELY to prevent flashing
    setCurrentBattle([]);
    setSelectedPokemon([]);
    
    const isInitialBattle = !initialBattleStartedRef.current || (!currentBattle || currentBattle.length === 0);
    
    if (autoTriggerDisabledRef.current && !isInitialBattle) {
      console.log('[AUTO_TRIGGER_PREVENTION] Auto-trigger disabled - ignoring non-initial battle request');
      return [];
    }
    
    battleTransitionCountRef.current++;
    const transitionId = battleTransitionCountRef.current;
    
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Starting battle with immediate clear`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: No Pokemon data available`);
      return [];
    }
    
    const currentBattleStarter = battleStarter || createEmptyBattleStarter();
    
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
      const battle = currentBattleStarter.startNewBattle(battleType, false, false);
      
      if (!battle || battle.length === 0) {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Battle generation failed`);
        return [];
      }

      // Set the new battle immediately - no delay
      setCurrentBattle(battle);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ SUCCESS: Battle set immediately`);
      
      return battle;

    } catch (error) {
      console.error(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ ERROR:`, error);
      return [];
    } finally {
      battleGenerationInProgressRef.current = false;
    }
  }, [
    battleStarter,
    setSelectedPokemon,
    setCurrentBattle,
    allPokemon.length
  ]); // CRITICAL FIX: Removed currentRankings dependency

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

  const resetSuggestionPriorityExplicitly = () => {
    const timestamp = new Date().toISOString();
    suggestionBattleCountRef.current = 0;
    processedSuggestionBattlesRef.current.clear();
    const prevValue = forcedPriorityBattlesRef.current;
    forcedPriorityBattlesRef.current = Math.max(20, totalSuggestionsRef.current * 5);
    console.log(`[${timestamp}] forcedPriorityBattlesRef reset from ${prevValue} to: ${forcedPriorityBattlesRef.current}`);
    
    milestoneCrossedRef.current = true;
    priorityModeActiveRef.current = true;
    consecutiveBattlesWithoutNewPokemonRef.current = 0;
    identicalBattleCount.current = 0;
    previousBattleIds.current = [];
  };

  // OPTIMIZED: Initialization effect
  useEffect(() => {
    console.log('[DEBUG useBattleStarterIntegration] Initial setup complete');
    
    initializationCompleteRef.current = false;
    initialGetBattleFiredRef.current = false;
    
    return () => {
      console.log(`[${new Date().toISOString()}] useBattleStarterIntegration cleanup`);
    };
  }, []);

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: () => {
      resetSuggestionPriorityExplicitly();
    },
    performEmergencyReset
  };
};
