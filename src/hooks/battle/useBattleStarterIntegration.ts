
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
  // Stabilize component instance tracking
  const instanceIdRef = useRef(`battleStarter-${Date.now()}`);
  console.log('[DEBUG useBattleStarterIntegration] Instance:', instanceIdRef.current, 'allPokemon length:', allPokemon?.length || 0);
  
  // Initialize refs with appropriate default values
  const processedSuggestionBattlesRef = useRef<Set<number>>(new Set());
  const suggestionBattleCountRef = useRef(0);
  const forcedPriorityBattlesRef = useRef(0);
  const totalSuggestionsRef = useRef(0);
  const milestoneCrossedRef = useRef(false);
  const priorityModeActiveRef = useRef(false);
  const consecutiveBattlesWithoutNewPokemonRef = useRef(0);
  const lastBattleAttemptTimestampRef = useRef(0);
  const throttleTimeMs = 500; // Reduced from 800ms to 500ms for better responsiveness
  const previousBattleIds = useRef<number[]>([]);
  const identicalBattleCount = useRef(0);
  const battleGenerationInProgressRef = useRef(false);
  const initializationCompleteRef = useRef(false);
  const initialGetBattleFiredRef = useRef(false);
  const initializationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Store the battleStarter ref for stable access
  const battleStarterInstanceRef = useRef<ReturnType<typeof createBattleStarter> | null>(null);
  const startNewBattleRefFn = useRef<((type: BattleType) => Pokemon[]) | null>(null);
  
  // Add ref to hold the latest startNewBattle callback
  const startNewBattleCallbackRef = useRef<((battleType: BattleType) => Pokemon[]) | null>(null);
  
  // NEW: Add a ref to track the last successfully set battle to avoid duplicate event handling
  const lastSetBattleIdsRef = useRef<number[]>([]);
  
  console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef initialized to:', forcedPriorityBattlesRef.current);
  
  // Initialize component state tracking - MEMOIZED to prevent re-runs
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration initialized with ${allPokemon?.length || 0} Pokémon`);
    
    if (initializationTimerRef.current) {
      clearTimeout(initializationTimerRef.current);
    }
    
    initializationTimerRef.current = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] useBattleStarterIntegration initialization complete`);
      initializationCompleteRef.current = true;
      
      // Auto-trigger a battle if none exists and we have Pokemon data
      if (allPokemon && allPokemon.length > 0 && (!currentBattle || currentBattle.length === 0)) {
        console.log('[DEBUG] No battle exists after initialization, triggering initial battle');
        if (startNewBattleCallbackRef.current) {
          console.log('[DEBUG] Calling startNewBattle from timer via ref');
          startNewBattleCallbackRef.current("pairs");
        } else {
          console.log('[DEBUG] startNewBattleCallbackRef not available, dispatching force-new-battle event');
          document.dispatchEvent(new CustomEvent("force-new-battle", { 
            detail: { battleType: "pairs" }
          }));
        }
      } else {
        console.log('[DEBUG] Battle already exists after initialization:', currentBattle?.length || 0);
      }
      
    }, 800); // Reduced from 1000ms to 800ms
    
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, [allPokemon.length]); // Only depend on length, not entire array

  // OPTIMIZED: Only create battleStarter when we have Pokemon data
  const battleStarter = useMemo<ExtendedBattleStarter>(() => {
    console.log('[DEBUG battleStarterInstance useMemo] Evaluating with allPokemon length:', allPokemon?.length || 0);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log("[DEBUG battleStarterInstance useMemo] No Pokémon data available, returning empty battleStarter");
      return createEmptyBattleStarter();
    }

    console.log(`[DEBUG battleStarterInstance useMemo] Creating battleStarter with ${allPokemon.length} Pokémon and ${currentRankings.length} rankings`);
    
    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );

    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    
    const battleStarterInstance = createBattleStarter(
      allPokemon,
      currentRankings
    );

    battleStarterInstanceRef.current = battleStarterInstance;
    
    const extendedInstance: ExtendedBattleStarter = {
      startNewBattle: battleStarterInstance.startNewBattle,
      trackLowerTierLoss: battleStarterInstance.trackLowerTierLoss,
      getSuggestions: () => {
        return (currentRankings || []).filter(
          p => p.suggestedAdjustment && !p.suggestedAdjustment.used
        );
      }
    };
    
    console.log("[DEBUG battleStarterInstance useMemo] Created and returning new extended battleStarter");
    
    return extendedInstance;
  }, [
    allPokemon.length, // Only depend on length to avoid recreation on every ranking change
    currentRankings.length
  ]); // Removed setCurrentBattle dependency as it's not needed

  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log('[DEBUG] startNewBattle called:', {
      battleType,
      initComplete: initializationCompleteRef.current,
      genInProgress: battleGenerationInProgressRef.current,
      currentBattleLength: currentBattle?.length || 0,
      allPokemonLength: allPokemon?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] startNewBattle called with battleType: ${battleType}`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`[${timestamp}] No Pokemon data available, cannot start battle. allPokemon?.length: ${allPokemon?.length}`);
      return [];
    }
    
    const currentBattleStarter = battleStarter || createEmptyBattleStarter();
    console.log(`[${timestamp}] Using ${currentBattleStarter === battleStarter ? 'original' : 'fallback empty'} battleStarter`);
    
    startNewBattleRefFn.current = startNewBattle;
    
    if (!initializationCompleteRef.current) {
      console.log(`[${timestamp}] Skipping battle generation - initialization not complete`);
      return [];
    }
    
    if (battleGenerationInProgressRef.current) {
      console.log(`[${timestamp}] Battle generation already in progress, ignoring startNewBattle call`);
      return [];
    }
    
    console.log(`[${timestamp}] Setting battleGenerationInProgressRef.current = true`);
    battleGenerationInProgressRef.current = true;
    
    if (!initialGetBattleFiredRef.current) {
      initialGetBattleFiredRef.current = true;
      console.log(`[${timestamp}] Initial startNewBattle call`);
    }
    
    const now = Date.now();
    const timeSinceLastAttempt = now - lastBattleAttemptTimestampRef.current;
    
    const adjustedThrottleTime = throttleTimeMs * Math.pow(2, Math.min(3, identicalBattleCount.current));
    
    if (timeSinceLastAttempt < adjustedThrottleTime) {
      console.log(`[${timestamp}] Throttling battle generation. Last attempt: ${timeSinceLastAttempt}ms ago. Required interval: ${adjustedThrottleTime}ms`);
      battleGenerationInProgressRef.current = false;
      return [];
    }
    
    lastBattleAttemptTimestampRef.current = now;

    console.log(`[${timestamp}] Starting new battle with allPokemon size: ${allPokemon.length}, currentRankings size: ${currentRankings.length}`);
    
    const rankedIds = new Set(currentRankings.map(p => p.id));
    const unrankedPokemon = allPokemon.filter(p => !rankedIds.has(p.id));
    console.log(`[${timestamp}] - unranked Pokémon count: ${unrankedPokemon.length}`);
    
    if (milestoneCrossedRef.current) {
      console.log(`[${timestamp}] Post-milestone battle. Will prioritize unranked Pokémon selection.`);
      milestoneCrossedRef.current = false;
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    }

    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    console.log(`[${timestamp}] Available suggestedPokemon.length:`, suggestedPokemon.length);

    const shouldForcePriority = forcedPriorityBattlesRef.current > 0 && suggestedPokemon.length > 0;
    console.log(`[${timestamp}] shouldForcePriority decision:`, shouldForcePriority);
    
    priorityModeActiveRef.current = suggestedPokemon.length > 0 && forcedPriorityBattlesRef.current > 0;

    let battle: Pokemon[] = [];
    let forceUnrankedSelection = false;
    
    const MAX_BATTLES_WITHOUT_NEW_POKEMON = 3;
    if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
      forceUnrankedSelection = true;
      console.log(`[${timestamp}] FORCING unranked selection after ${consecutiveBattlesWithoutNewPokemonRef.current} battles without new Pokémon`);
    }
    
    if (milestoneCrossedRef.current || 
        (unrankedPokemon.length > 0 && unrankedPokemon.length > (currentRankings.length * 9))) {
      forceUnrankedSelection = true;
      console.log(`[${timestamp}] Forcing unranked selection for variety:`, forceUnrankedSelection);
    }
    
    try {
      if (shouldForcePriority) {
        console.log(`[${timestamp}] 🚨 Explicitly FORCING a suggestion-priority battle. forceUnrankedSelection: ${forceUnrankedSelection}`);
        battle = currentBattleStarter.startNewBattle(battleType, true, forceUnrankedSelection);

        const battleIncludesSuggestion = battle.some(pokemon => {
          const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
          return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
        });

        if (battleIncludesSuggestion) {
          forcedPriorityBattlesRef.current--;
          console.log(`[${timestamp}] forcedPriorityBattlesRef decremented to:`, 
            forcedPriorityBattlesRef.current, 'after successfully including a suggestion');
        } else {
          console.log(`[${timestamp}] No suggestion included in battle despite forced priority. Counter unchanged:`, forcedPriorityBattlesRef.current);
          if (forcedPriorityBattlesRef.current > 0) {
            forcedPriorityBattlesRef.current--;
            console.log(`[${timestamp}] Decrementing counter anyway to prevent stalling:`, forcedPriorityBattlesRef.current);
          }
        }
      } else {
        console.log(`[${timestamp}] 🎮 Using standard battle selection (forceUnrankedSelection: ${forceUnrankedSelection})`);
        battle = currentBattleStarter.startNewBattle(battleType, false, forceUnrankedSelection);
      }

      if (!battle || battle.length === 0) {
        console.log(`[${timestamp}] Battle generation was throttled or failed, not updating state`);
        return [];
      }

      if (battle && markSuggestionFullyUsed) {
        battle.forEach(pokemonInBattle => {
          const pk = pokemonInBattle as RankedPokemon;
          if (pk.suggestedAdjustment && pk.suggestedAdjustment.used === true) {
            console.log(`[${timestamp}] Detected ${pk.name} was marked as fully used by createBattleStarter. Persisting this state.`);
            markSuggestionFullyUsed(pk, true);
          }
        });
      }

      const hasSuggestionInBattle = battle.some(pokemon => {
        const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
        return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
      });

      const newPokemonCount = battle.filter(pokemon => !currentRankings.some(rp => rp.id === pokemon.id)).length;

      if (hasSuggestionInBattle) {
        suggestionBattleCountRef.current++;
        console.log(`[${timestamp}] ✅ Battle explicitly contains suggestion (#${suggestionBattleCountRef.current} since milestone).`);
      } else if (newPokemonCount > 0) {
        console.log(`[${timestamp}] ✅ Battle introduces ${newPokemonCount} new Pokémon that weren't previously ranked.`);
        consecutiveBattlesWithoutNewPokemonRef.current = 0;
      } else {
        console.log(`[${timestamp}] 🚫 Battle contains no suggestions and no new Pokémon explicitly.`);
        consecutiveBattlesWithoutNewPokemonRef.current++;
        console.log(`[${timestamp}] ⚠️ Consecutive battles without new Pokémon: ${consecutiveBattlesWithoutNewPokemonRef.current}`);
        if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
          console.log(`[${timestamp}] ⚠️ Will force unranked selection next battle to ensure variety`);
        }
      }

      setSelectedPokemon([]);
      console.log(`[${timestamp}] 📌 Cleared selected Pokemon`);

      // Check for identical battles
      const battleIds = battle.map(p => p.id);
      const isIdentical = areBattlesIdentical(battle, previousBattleIds.current);
      
      if (!isIdentical) {
        previousBattleIds.current = battleIds;
        lastSetBattleIdsRef.current = battleIds; // NEW: Track what we actually set
        setCurrentBattle(battle);
        console.log(`[${timestamp}] ✅ setCurrentBattle called with [${battleIds.join(', ')}]`);
        
        // Dispatch battle-created event
        const battleEvent = new CustomEvent('battle-created', {
          detail: {
            pokemonIds: battleIds,
            pokemonNames: battle.map(p => p.name),
            timestamp: Date.now(),
            wasForced: false
          }
        });
        document.dispatchEvent(battleEvent);
      } else {
        console.warn(`[${timestamp}] ⚠️ Generated identical battle, not updating state`);
      }

      return battle;

    } catch (error) {
      console.error('[DEBUG] Error in battleStarter.startNewBattle:', error);
      return [];
    } finally {
      // Use a small timeout to ensure any state updates from setCurrentBattle have a chance to process
      setTimeout(() => {
        console.log(`[${new Date().toISOString()}] Setting battleGenerationInProgressRef.current = false (inside finally block)`);
        battleGenerationInProgressRef.current = false;
      }, 50);
    }
  }, [
    allPokemon.length, // Only depend on length, not entire array
    currentRankings.length, // Only depend on length, not entire array
    battleStarter,
    setSelectedPokemon,
    markSuggestionFullyUsed
  ]); // Removed setCurrentBattle dependency

  // Update the ref whenever startNewBattle changes
  useEffect(() => {
    startNewBattleCallbackRef.current = startNewBattle;
    console.log('[DEBUG useBattleStarterIntegration] Updated startNewBattleCallbackRef with new function');
  }, [startNewBattle]);

  // OPTIMIZED: Event listeners with better duplicate detection
  useEffect(() => {
    console.log('[DEBUG useBattleStarterIntegration] Setting up event listeners');
    
    const handlePrioritize = () => {
      suggestionBattleCountRef.current = 0;
      processedSuggestionBattlesRef.current.clear();

      const suggestedPokemon = currentRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );

      totalSuggestionsRef.current = suggestedPokemon.length;
      forcedPriorityBattlesRef.current = Math.max(20, suggestedPokemon.length * 5);
      console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef set to:', forcedPriorityBattlesRef.current, 'after prioritize trigger');
      
      priorityModeActiveRef.current = suggestedPokemon.length > 0;
      consecutiveBattlesWithoutNewPokemonRef.current = 0;

      if (totalSuggestionsRef.current > 0) {
        toast({
          title: "Prioritizing suggestions",
          description: `Focusing on ${totalSuggestionsRef.current} suggestion(s) for next ${forcedPriorityBattlesRef.current} battles`,
          duration: 4000
        });
      }
    };
    
    const handleMilestoneReached = (event: Event) => {
      console.log('[DEBUG useBattleStarterIntegration] Milestone reached event detected');
      milestoneCrossedRef.current = true;
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    };

    const handleBattleCreated = (event: CustomEvent) => {
      const { pokemonIds, timestamp, wasForced } = event.detail || {};
      if (!pokemonIds || !pokemonIds.length) return;
      
      console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: Received event. pokemonIds:', pokemonIds, 'wasForced:', wasForced);
      
      // IMPROVED: Compare against what we actually last set, not what was previously in the ref
      const isIdentical = lastSetBattleIdsRef.current.length > 0 && 
        pokemonIds.length === lastSetBattleIdsRef.current.length &&
        pokemonIds.every(id => lastSetBattleIdsRef.current.includes(id)) &&
        lastSetBattleIdsRef.current.every(id => pokemonIds.includes(id));
      
      console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: isIdentical check result:', isIdentical);
      console.log('[DEBUG] Battle created event received:', {
        pokemonIds,
        willUpdateState: !isIdentical,
        lastSetBattleIds: lastSetBattleIdsRef.current
      });
      
      if (isIdentical && !wasForced) {
        identicalBattleCount.current++;
        console.warn(`⚠️ [useBattleStarterIntegration] Identical battle detected ${identicalBattleCount.current} times`);
        
        if (identicalBattleCount.current >= 3) { // Increased threshold from 2 to 3
          console.warn('⚠️ Too many identical battles detected, triggering emergency reset');
          document.dispatchEvent(new CustomEvent('force-emergency-reset'));
          identicalBattleCount.current = 0;
          return;
        }
      } else {
        identicalBattleCount.current = 0;
      }
      
      // Mark that we're no longer generating a battle
      setTimeout(() => {
        console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: Setting battleGenerationInProgressRef.current = false.');
        battleGenerationInProgressRef.current = false;
        console.log(`[${new Date().toISOString()}] Battle generation marked as complete`);
      }, 100);
    };

    const handleForceNewBattle = (e: Event) => {
      const event = e as CustomEvent;
      const battleType = event.detail?.battleType || "pairs";
      console.log(`[DEBUG EventListener] 'force-new-battle' event received for type: ${battleType}. Calling startNewBattle via ref.`);
      
      identicalBattleCount.current = 0;
      
      if (battleGenerationInProgressRef.current) {
        console.log(`[${new Date().toISOString()}] Battle generation already in progress, ignoring force-new-battle event`);
        return;
      }
      
      lastBattleAttemptTimestampRef.current = 0;
      
      if (startNewBattleCallbackRef.current) {
        console.log(`[DEBUG EventListener] Calling startNewBattle via ref with battleType: ${battleType}`);
        startNewBattleCallbackRef.current(battleType);
      } else {
        console.error('[DEBUG EventListener] startNewBattleCallbackRef.current is not defined!');
      }
    };

    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);
    window.addEventListener("milestoneReached", handleMilestoneReached);
    document.addEventListener("battle-created", handleBattleCreated as EventListener);
    document.addEventListener("force-new-battle", handleForceNewBattle as EventListener);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
      window.removeEventListener("milestoneReached", handleMilestoneReached);
      document.removeEventListener("battle-created", handleBattleCreated as EventListener);
      document.removeEventListener("force-new-battle", handleForceNewBattle as EventListener);
    };
  }, [currentRankings.length]); // Only depend on rankings length, not entire array

  const { performEmergencyReset } = useBattleEmergencyReset(
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
  }, []); // Empty dependency array

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: resetSuggestionPriorityExplicitly,
    performEmergencyReset
  };
};
