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
  
  // CRITICAL FIX: Track when battleStarter was first created to prevent recreation
  const battleStarterCreatedRef = useRef(false);
  const stablePokemonLengthRef = useRef(0);
  
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
  
  // Store the battleStarter ref for stable access - CRITICAL FIX: Store the extended version
  const battleStarterInstanceRef = useRef<ExtendedBattleStarter | null>(null);
  const startNewBattleRefFn = useRef<((type: BattleType) => Pokemon[]) | null>(null);
  
  // Add ref to hold the latest startNewBattle callback
  const startNewBattleCallbackRef = useRef<((battleType: BattleType) => Pokemon[]) | null>(null);
  
  // CRITICAL: Add a ref to track the last successfully set battle to avoid duplicate event handling
  const lastSetBattleIdsRef = useRef<number[]>([]);
  
  // NEW: Add battle transition debugging counter
  const battleTransitionCountRef = useRef(0);
  
  console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef initialized to:', forcedPriorityBattlesRef.current);
  
  // CRITICAL FIX: Enhanced milestone event listeners with immediate blocking
  useEffect(() => {
    const handleMilestoneBlocking = (event: CustomEvent) => {
      console.log('[MILESTONE_BLOCKING] Milestone blocking event received:', event.detail);
      autoTriggerDisabledRef.current = true; // Immediately disable auto-triggers
      console.log('[MILESTONE_BLOCKING] Auto-triggers DISABLED for milestone');
    };

    const handleMilestoneUnblocked = (event: CustomEvent) => {
      console.log('[MILESTONE_COORD] Milestone unblocked event received:', event.detail);
      autoTriggerDisabledRef.current = false; // Re-enable auto-triggers immediately
      console.log('[MILESTONE_COORD] Auto-triggers re-enabled');
    };

    const handleMilestoneDismissed = (event: CustomEvent) => {
      console.log('[CONTROLLED_TRANSITION] Milestone dismissed - re-enabling auto-triggers:', event.detail);
      autoTriggerDisabledRef.current = false; // Always re-enable on dismissal
      console.log('[CONTROLLED_TRANSITION] Auto-triggers re-enabled after dismissal');
    };
    
    document.addEventListener('milestone-blocking', handleMilestoneBlocking as EventListener);
    document.addEventListener('milestone-unblocked', handleMilestoneUnblocked as EventListener);
    document.addEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
    
    return () => {
      document.removeEventListener('milestone-blocking', handleMilestoneBlocking as EventListener);
      document.removeEventListener('milestone-unblocked', handleMilestoneUnblocked as EventListener);
      document.removeEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
    };
  }, []);

  // CRITICAL FIX: Start initial battle when Pokemon data is available - but only once
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration Pokemon data check: ${allPokemon?.length || 0} Pokemon available`);
    
    if (allPokemon && allPokemon.length > 0 && !initialBattleStartedRef.current) {
      console.log(`[${timestamp}] Starting initial battle with ${allPokemon.length} Pokemon`);
      initialBattleStartedRef.current = true;
      
      // Start initial battle after short delay to ensure all systems are ready
      setTimeout(() => {
        if (!autoTriggerDisabledRef.current && (!currentBattle || currentBattle.length === 0)) {
          console.log(`[${timestamp}] Triggering initial battle start`);
          const initialBattle = startNewBattle("pairs");
          if (initialBattle && initialBattle.length > 0) {
            console.log(`✅ [INITIAL_BATTLE] Started with Pokemon: ${initialBattle.map(p => p.name).join(', ')}`);
          }
        } else {
          console.log(`[${timestamp}] Skipping initial battle - auto-triggers disabled or battle already exists`);
        }
      }, 500);
    }
  }, [allPokemon.length]); // Removed currentBattle?.length dependency to prevent auto-refresh

  // CRITICAL FIX: Simplified initialization - NO auto-trigger on init
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
  }, [allPokemon.length]);

  // CRITICAL FIX: Only create battleStarter ONCE when we first have Pokemon data - never recreate it
  const battleStarter = useMemo<ExtendedBattleStarter>(() => {
    console.log('[DEBUG battleStarterInstance useMemo] Evaluating with allPokemon length:', allPokemon?.length || 0);
    console.log('[DEBUG battleStarterInstance useMemo] battleStarterCreatedRef.current:', battleStarterCreatedRef.current);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log("[DEBUG battleStarterInstance useMemo] No Pokémon data available, returning empty battleStarter");
      return createEmptyBattleStarter();
    }

    // CRITICAL FIX: Only create battleStarter once, even if more Pokemon are loaded later
    if (battleStarterCreatedRef.current && stablePokemonLengthRef.current > 0) {
      console.log(`[DEBUG battleStarterInstance useMemo] BattleStarter already created with ${stablePokemonLengthRef.current} Pokemon - not recreating for ${allPokemon.length} Pokemon`);
      // CRITICAL FIX: Return the stored extended battleStarter, not the raw one
      return battleStarterInstanceRef.current || createEmptyBattleStarter();
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
    
    const extendedInstance: ExtendedBattleStarter = {
      startNewBattle: battleStarterInstance.startNewBattle,
      trackLowerTierLoss: battleStarterInstance.trackLowerTierLoss,
      getSuggestions: () => {
        return (currentRankings || []).filter(
          p => p.suggestedAdjustment && !p.suggestedAdjustment.used
        );
      }
    };

    // CRITICAL FIX: Store the extended instance, not the raw one
    battleStarterInstanceRef.current = extendedInstance;
    
    // Mark as created and store the length
    battleStarterCreatedRef.current = true;
    stablePokemonLengthRef.current = allPokemon.length;
    
    console.log("[DEBUG battleStarterInstance useMemo] Created and returning new extended battleStarter - will NOT recreate");
    
    return extendedInstance;
  }, [
    // CRITICAL FIX: Only depend on currentRankings length to avoid recreation when Pokemon are added
    currentRankings.length
    // Removed allPokemon.length dependency to prevent recreation when background loading completes
  ]);

  const startNewBattle = useCallback((battleType: BattleType) => {
    // CRITICAL FIX: Allow initial battles but block unwanted auto-replacements
    const isInitialBattle = !initialBattleStartedRef.current || (!currentBattle || currentBattle.length === 0);
    
    if (autoTriggerDisabledRef.current && !isInitialBattle) {
      console.log('[AUTO_TRIGGER_PREVENTION] Auto-trigger disabled - ignoring non-initial battle request');
      return [];
    }
    
    // CRITICAL: Increment battle transition counter for debugging
    battleTransitionCountRef.current++;
    const transitionId = battleTransitionCountRef.current;
    
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== Starting Battle Transition Analysis =====`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Requested battleType: ${battleType}`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] autoTriggerDisabledRef.current: ${autoTriggerDisabledRef.current}`);
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] isInitialBattle: ${isInitialBattle}`);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] startNewBattle called with battleType: ${battleType}`);
    
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
    
    const now = Date.now();
    
    console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ PASSED: Throttling disabled for seamless transitions`);
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
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ FAILED: Battle generation failed, not updating state`);
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
        
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ Battle state updated successfully`);
      } else {
        console.warn(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ⚠️ IDENTICAL BATTLE DETECTED - Generating new battle`);
        
        identicalBattleCount.current++;
        console.warn(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Identical battle count: ${identicalBattleCount.current}`);
        
        if (identicalBattleCount.current >= 3) {
          console.error(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ TOO MANY IDENTICAL BATTLES - Triggering emergency reset`);
          document.dispatchEvent(new CustomEvent('force-emergency-reset'));
          identicalBattleCount.current = 0;
          return [];
        }
        
        // CRITICAL FIX: Try again with forced variety to break identical pattern
        console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] 🔄 Attempting new battle with forced variety`);
        const retryBattle = currentBattleStarter.startNewBattle(battleType, false, true);
        if (retryBattle && retryBattle.length > 0) {
          const retryIds = retryBattle.map(p => p.id);
          const isRetryIdentical = retryIds.length === battleIds.length &&
            retryIds.every(id => battleIds.includes(id)) &&
            battleIds.every(id => retryIds.includes(id));
            
          if (!isRetryIdentical) {
            console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ✅ Retry successful with different battle: [${retryIds.join(', ')}]`);
            previousBattleIds.current = retryIds;
            lastSetBattleIdsRef.current = retryIds;
            setCurrentBattle(retryBattle);
            identicalBattleCount.current = 0;
            return retryBattle;
          }
        }
      }

      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ===== Battle Transition Analysis Complete =====`);
      return battle;

    } catch (error) {
      console.error(`[BATTLE_TRANSITION_DEBUG #${transitionId}] ❌ ERROR in battleStarter.startNewBattle:`, error);
      return [];
    } finally {
      // CRITICAL FIX: Immediately reset the flag to allow rapid successive calls
      console.log(`[BATTLE_TRANSITION_DEBUG #${transitionId}] Setting battleGenerationInProgressRef.current = false (immediate)`);
      battleGenerationInProgressRef.current = false;
    }
  }, [
    // CRITICAL FIX: Remove allPokemon.length dependency to prevent recreation when background loading completes
    currentRankings.length, // Only depend on length, not entire array
    battleStarter,
    setSelectedPokemon,
    markSuggestionFullyUsed
    // Removed currentBattle?.length dependency to prevent auto-refresh
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
