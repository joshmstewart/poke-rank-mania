
import { useRef } from "react";

export const useBattleStarterState = () => {
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
  const initialBattleStartedRef = useRef(false);
  
  // Add ref to hold the latest startNewBattle callback
  const startNewBattleCallbackRef = useRef<((battleType: any) => any[]) | null>(null);
  
  // CRITICAL: Add a ref to track the last successfully set battle to avoid duplicate event handling
  const lastSetBattleIdsRef = useRef<number[]>([]);
  
  // NEW: Add battle transition debugging counter
  const battleTransitionCountRef = useRef(0);

  // CRITICAL: Add detailed logging for battle 10-11 flashing issue
  const battleSetHistoryRef = useRef<Array<{
    battleNumber: number;
    pokemonIds: number[];
    timestamp: string;
    action: string;
  }>>([]);

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

  return {
    processedSuggestionBattlesRef,
    suggestionBattleCountRef,
    forcedPriorityBattlesRef,
    totalSuggestionsRef,
    milestoneCrossedRef,
    priorityModeActiveRef,
    consecutiveBattlesWithoutNewPokemonRef,
    previousBattleIds,
    identicalBattleCount,
    battleGenerationInProgressRef,
    initializationCompleteRef,
    initialGetBattleFiredRef,
    initializationTimerRef,
    autoTriggerDisabledRef,
    initialBattleStartedRef,
    startNewBattleCallbackRef,
    lastSetBattleIdsRef,
    battleTransitionCountRef,
    battleSetHistoryRef,
    resetSuggestionPriorityExplicitly
  };
};
