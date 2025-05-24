
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
  const throttleTimeMs = 500;
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
  
  // CRITICAL: Add a ref to track the last successfully set battle to avoid duplicate event handling
  const lastSetBattleIdsRef = useRef<number[]>([]);
  
  // NEW: Add battle transition debugging counter
  const battleTransitionCountRef = useRef(0);
  
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
        console.log('[BATTLE_TRANSITION_DEBUG] No battle exists after initialization, triggering initial battle');
        if (startNewBattleCallbackRef.current) {
          console.log('[BATTLE_TRANSITION_DEBUG] Calling startNewBattle from timer via ref');
          startNewBattleCallbackRef.current("pairs");
        } else {
          console.log('[BATTLE_TRANSITION_DEBUG] startNewBattleCallbackRef not available, dispatching force-new-battle event');
          document.dispatchEvent(new CustomEvent("force-new-battle", { 
            detail: { battleType: "pairs" }
          }));
        }
      } else {
        console.log('[BATTLE_TRANSITION_DEBUG] Battle already exists after initialization:', currentBattle?.length || 0);
      }
      
    }, 300); // Reduced from 800ms to 300ms for better responsiveness
    
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
  ]);

  const startNewBattle = useCallback((battleType: BattleType) => {
    // CRITICAL: Increment battle transition counter for debugging
    battleTransitionCountRef.current++;
    const transitionId = battleTransitionCountRef.current;
    
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== Starting Battle Transition Analysis =====`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Requested battleType: ${battleType}`);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] startNewBattle called with battleType: ${battleType}`);
    
    // CRITICAL: Log current state before any checks
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Current state check:`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - allPokemon?.length: ${allPokemon?.length || 0}`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - currentRankings.length: ${currentRankings.length}`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - initializationCompleteRef.current: ${initializationCompleteRef.current}`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - battleGenerationInProgressRef.current: ${battleGenerationInProgressRef.current}`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - previousBattleIds.current: [${previousBattleIds.current.join(', ')}]`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - lastSetBattleIdsRef.current: [${lastSetBattleIdsRef.current.join(', ')}]`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: No Pokemon data available. allPokemon?.length: ${allPokemon?.length}`);
      return [];
    }
    
    const currentBattleStarter = battleStarter || createEmptyBattleStarter();
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Using ${currentBattleStarter === battleStarter ? 'original' : 'fallback empty'} battleStarter`);
    
    startNewBattleRefFn.current = startNewBattle;
    
    if (!initializationCompleteRef.current) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Initialization not complete`);
      return [];
    }
    
    if (battleGenerationInProgressRef.current) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Battle generation already in progress`);
      return [];
    }
    
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ PASSED: All initial checks`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Setting battleGenerationInProgressRef.current = true`);
    battleGenerationInProgressRef.current = true;
    
    if (!initialGetBattleFiredRef.current) {
      initialGetBattleFiredRef.current = true;
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] This is the initial startNewBattle call`);
    } else {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] This is a subsequent startNewBattle call (transition to next battle)`);
    }
    
    const now = Date.now();
    const timeSinceLastAttempt = now - lastBattleAttemptTimestampRef.current;
    
    const adjustedThrottleTime = throttleTimeMs * Math.pow(2, Math.min(3, identicalBattleCount.current));
    
    if (timeSinceLastAttempt < adjustedThrottleTime) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Throttling battle generation. Last attempt: ${timeSinceLastAttempt}ms ago. Required interval: ${adjustedThrottleTime}ms`);
      battleGenerationInProgressRef.current = false;
      return [];
    }
    
    lastBattleAttemptTimestampRef.current = now;

    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ PASSED: Throttling check`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Starting new battle with allPokemon size: ${allPokemon.length}, currentRankings size: ${currentRankings.length}`);
    
    const rankedIds = new Set(currentRankings.map(p => p.id));
    const unrankedPokemon = allPokemon.filter(p => !rankedIds.has(p.id));
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - unranked Pokémon count: ${unrankedPokemon.length}`);
    
    if (milestoneCrossedRef.current) {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Post-milestone battle. Will prioritize unranked Pokémon selection.`);
      milestoneCrossedRef.current = false;
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    }

    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Available suggestedPokemon.length:`, suggestedPokemon.length);

    const shouldForcePriority = forcedPriorityBattlesRef.current > 0 && suggestedPokemon.length > 0;
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] shouldForcePriority decision:`, shouldForcePriority);
    
    priorityModeActiveRef.current = suggestedPokemon.length > 0 && forcedPriorityBattlesRef.current > 0;

    let battle: Pokemon[] = [];
    let forceUnrankedSelection = false;
    
    const MAX_BATTLES_WITHOUT_NEW_POKEMON = 3;
    if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
      forceUnrankedSelection = true;
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] FORCING unranked selection after ${consecutiveBattlesWithoutNewPokemonRef.current} battles without new Pokémon`);
    }
    
    if (milestoneCrossedRef.current || 
        (unrankedPokemon.length > 0 && unrankedPokemon.length > (currentRankings.length * 9))) {
      forceUnrankedSelection = true;
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Forcing unranked selection for variety:`, forceUnrankedSelection);
    }
    
    try {
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== Calling battleStarter.startNewBattle =====`);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Parameters: battleType=${battleType}, forceSuggestion=${shouldForcePriority}, forceUnranked=${forceUnrankedSelection}`);
      
      if (shouldForcePriority) {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] 🚨 Explicitly FORCING a suggestion-priority battle. forceUnrankedSelection: ${forceUnrankedSelection}`);
        battle = currentBattleStarter.startNewBattle(battleType, true, forceUnrankedSelection);

        const battleIncludesSuggestion = battle.some(pokemon => {
          const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
          return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
        });

        if (battleIncludesSuggestion) {
          forcedPriorityBattlesRef.current--;
          console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] forcedPriorityBattlesRef decremented to:`, 
            forcedPriorityBattlesRef.current, 'after successfully including a suggestion');
        } else {
          console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] No suggestion included in battle despite forced priority. Counter unchanged:`, forcedPriorityBattlesRef.current);
          if (forcedPriorityBattlesRef.current > 0) {
            forcedPriorityBattlesRef.current--;
            console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Decrementing counter anyway to prevent stalling:`, forcedPriorityBattlesRef.current);
          }
        }
      } else {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] 🎮 Using standard battle selection (forceUnrankedSelection: ${forceUnrankedSelection})`);
        battle = currentBattleStarter.startNewBattle(battleType, false, forceUnrankedSelection);
      }

      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== battleStarter.startNewBattle returned =====`);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Returned battle length: ${battle?.length || 0}`);
      if (battle && battle.length > 0) {
        const battleIds = battle.map(p => p.id);
        const battleNames = battle.map(p => p.name);
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Returned battle IDs: [${battleIds.join(', ')}]`);
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Returned battle names: [${battleNames.join(', ')}]`);
      }

      if (!battle || battle.length === 0) {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Battle generation was throttled or failed, not updating state`);
        return [];
      }

      if (battle && markSuggestionFullyUsed) {
        battle.forEach(pokemonInBattle => {
          const pk = pokemonInBattle as RankedPokemon;
          if (pk.suggestedAdjustment && pk.suggestedAdjustment.used === true) {
            console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Detected ${pk.name} was marked as fully used by createBattleStarter. Persisting this state.`);
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
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ Battle explicitly contains suggestion (#${suggestionBattleCountRef.current} since milestone).`);
      } else if (newPokemonCount > 0) {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ Battle introduces ${newPokemonCount} new Pokémon that weren't previously ranked.`);
        consecutiveBattlesWithoutNewPokemonRef.current = 0;
      } else {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] 🚫 Battle contains no suggestions and no new Pokémon explicitly.`);
        consecutiveBattlesWithoutNewPokemonRef.current++;
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ⚠️ Consecutive battles without new Pokémon: ${consecutiveBattlesWithoutNewPokemonRef.current}`);
        if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
          console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ⚠️ Will force unranked selection next battle to ensure variety`);
        }
      }

      setSelectedPokemon([]);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] 📌 Cleared selected Pokemon`);

      // CRITICAL: Enhanced identical battle checking with detailed logging
      const battleIds = battle.map(p => p.id);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== Checking for Identical Battle =====`);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Current battle IDs: [${battleIds.join(', ')}]`);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] previousBattleIds.current: [${previousBattleIds.current.join(', ')}]`);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] lastSetBattleIdsRef.current: [${lastSetBattleIdsRef.current.join(', ')}]`);
      
      const isIdenticalToPrevious = areBattlesIdentical(battle, previousBattleIds.current);
      const isIdenticalToLastSet = lastSetBattleIdsRef.current.length > 0 && 
        battleIds.length === lastSetBattleIdsRef.current.length &&
        battleIds.every(id => lastSetBattleIdsRef.current.includes(id)) &&
        lastSetBattleIdsRef.current.every(id => battleIds.includes(id));
      
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] isIdenticalToPrevious: ${isIdenticalToPrevious}`);
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] isIdenticalToLastSet: ${isIdenticalToLastSet}`);
      
      if (!isIdenticalToPrevious && !isIdenticalToLastSet) {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ NEW UNIQUE BATTLE - Proceeding with state update`);
        
        // Update our tracking BEFORE setting state
        previousBattleIds.current = battleIds;
        lastSetBattleIdsRef.current = battleIds;
        
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Updated previousBattleIds.current to: [${previousBattleIds.current.join(', ')}]`);
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Updated lastSetBattleIdsRef.current to: [${lastSetBattleIdsRef.current.join(', ')}]`);
        
        setCurrentBattle(battle);
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ setCurrentBattle called with [${battleIds.join(', ')}]`);
        
        // Reset identical battle counter on success
        identicalBattleCount.current = 0;
        
        // NOTE: Removed battle-created event dispatch to eliminate redundant processing
        // The event handler was causing misleading "identical battle" warnings
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ Battle state updated successfully (no event dispatch)`);
      } else {
        console.warn(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ⚠️ IDENTICAL BATTLE DETECTED - Not updating state`);
        console.warn(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - isIdenticalToPrevious: ${isIdenticalToPrevious}`);
        console.warn(`[BATTLE_TRANSITION_DEBUG #${transitionId}] - isIdenticalToLastSet: ${isIdenticalToLastSet}`);
        
        identicalBattleCount.current++;
        console.warn(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Identical battle count: ${identicalBattleCount.current}`);
        
        if (identicalBattleCount.current >= 3) {
          console.error(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ TOO MANY IDENTICAL BATTLES - Triggering emergency reset`);
          document.dispatchEvent(new CustomEvent('force-emergency-reset'));
          identicalBattleCount.current = 0;
          return [];
        }
      }

      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== Battle Transition Analysis Complete =====`);
      return battle;

    } catch (error) {
      console.error(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ ERROR in battleStarter.startNewBattle:`, error);
      return [];
    } finally {
      // Use a small timeout to ensure any state updates from setCurrentBattle have a chance to process
      setTimeout(() => {
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Setting battleGenerationInProgressRef.current = false (inside finally block)`);
        battleGenerationInProgressRef.current = false;
      }, 50);
    }
  }, [
    allPokemon.length, // Only depend on length, not entire array
    currentRankings.length, // Only depend on length, not entire array
    battleStarter,
    setSelectedPokemon,
    markSuggestionFullyUsed
  ]);

  // Update the ref whenever startNewBattle changes
  useEffect(() => {
    startNewBattleCallbackRef.current = startNewBattle;
    console.log('[DEBUG useBattleStarterIntegration] Updated startNewBattleCallbackRef with new function');
  }, [startNewBattle]);

  // OPTIMIZED: Event listeners with reduced redundancy
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

    const handleForceNewBattle = (e: Event) => {
      const event = e as CustomEvent;
      const battleType = event.detail?.battleType || "pairs";
      console.log(`[BATTLE_TRANSITION_DEBUG] 'force-new-battle' event received for type: ${battleType}. Calling startNewBattle via ref.`);
      
      identicalBattleCount.current = 0;
      
      if (battleGenerationInProgressRef.current) {
        console.log(`[BATTLE_TRANSITION_DEBUG] Battle generation already in progress, ignoring force-new-battle event`);
        return;
      }
      
      lastBattleAttemptTimestampRef.current = 0;
      
      if (startNewBattleCallbackRef.current) {
        console.log(`[BATTLE_TRANSITION_DEBUG] Calling startNewBattle via ref with battleType: ${battleType}`);
        startNewBattleCallbackRef.current(battleType);
      } else {
        console.error('[BATTLE_TRANSITION_DEBUG] startNewBattleCallbackRef.current is not defined!');
      }
    };

    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);
    window.addEventListener("milestoneReached", handleMilestoneReached);
    document.addEventListener("force-new-battle", handleForceNewBattle as EventListener);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
      window.removeEventListener("milestoneReached", handleMilestoneReached);
      document.removeEventListener("force-new-battle", handleForceNewBattle as EventListener);
    };
  }, [currentRankings.length]);

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
  }, []);

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority: resetSuggestionPriorityExplicitly,
    performEmergencyReset
  };
};
