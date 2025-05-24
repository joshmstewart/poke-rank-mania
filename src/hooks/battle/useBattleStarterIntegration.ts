
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
  allPokemon: Pokemon[] = [], // CRITICAL FIX: Default empty array
  currentRankings: RankedPokemon[] = [], // CRITICAL FIX: Default empty array
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionFullyUsed?: (pokemon: RankedPokemon, fullyUsed: boolean) => void,
  currentBattle?: Pokemon[] // NEW: Added currentBattle parameter to check if a battle exists
) => {
  // Add a timestamp to track if this hook instance is being recreated
  console.log('[DEBUG useBattleStarterIntegration] INSTANCE RUNNING/RE-CREATED - Timestamp:', Date.now());
  
  console.log('[DEBUG useBattleStarterIntegration] Hook called with allPokemon:', 
              Array.isArray(allPokemon) ? `array[${allPokemon?.length || 0}]` : 'not array', 
              'currentRankings:', 
              Array.isArray(currentRankings) ? `array[${currentRankings?.length || 0}]` : 'not array',
              'currentBattle:', 
              Array.isArray(currentBattle) ? `array[${currentBattle?.length || 0}]` : 'not array');
  
  // CRITICAL FIX: Initialize refs with appropriate default values
  const processedSuggestionBattlesRef = useRef<Set<number>>(new Set());
  const suggestionBattleCountRef = useRef(0);
  const forcedPriorityBattlesRef = useRef(0);
  const totalSuggestionsRef = useRef(0);
  const milestoneCrossedRef = useRef(false);
  const priorityModeActiveRef = useRef(false); // Ref to track if priority mode is active
  const consecutiveBattlesWithoutNewPokemonRef = useRef(0); // Track battles without introducing new Pokémon
  const lastBattleAttemptTimestampRef = useRef(0); // Track when we last tried to start a battle
  const throttleTimeMs = 800; // Minimum time between battle generation attempts
  const previousBattleIds = useRef<number[]>([]); // Track previous battle ids to avoid duplicates
  const identicalBattleCount = useRef(0); // Track how many times we've seen identical battles
  const battleGenerationInProgressRef = useRef(false); // Track if we're currently generating a battle
  const initializationCompleteRef = useRef(false); // Track if initialization is complete
  const initialGetBattleFiredRef = useRef(false); // Track if initial battle has been started
  const initializationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Reference to the initialization timer
  
  // Store the battleStarter ref for stable access
  const battleStarterInstanceRef = useRef<ReturnedType<typeof createBattleStarter> | null>(null);
  const startNewBattleRefFn = useRef<((type: BattleType) => Pokemon[]) | null>(null);  // NEW: Ref for startNewBattle function
  
  // Log initial value of forcedPriorityBattlesRef
  console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef initialized to:', forcedPriorityBattlesRef.current);
  
  // Initialize component state tracking
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration initialized with ${allPokemon?.length || 0} Pokémon`);
    console.log('[DEBUG useBattleStarterIntegration] useEffect Initialization: Fired. allPokemonLength:', allPokemon?.length || 0);
    
    // Mark initialization complete after a delay to allow other components to initialize
    if (initializationTimerRef.current) {
      clearTimeout(initializationTimerRef.current);
    }
    
    initializationTimerRef.current = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] useBattleStarterIntegration initialization complete`);
      console.log('[DEBUG useBattleStarterIntegration] InitTimer: Setting initializationCompleteRef.current = true');
      initializationCompleteRef.current = true;
      
      // NEW: Auto-trigger a battle if none exists and we have Pokemon data
      if (allPokemon && allPokemon.length > 0 && (!currentBattle || currentBattle.length === 0)) {
        console.log('[DEBUG] No battle exists after initialization, triggering initial battle');
        // Use the ref function if available
        if (startNewBattleRefFn.current) {
          console.log('[DEBUG] Calling startNewBattle from timer via ref');
          startNewBattleRefFn.current("pairs");
        } else {
          console.log('[DEBUG] startNewBattleRefFn not available, dispatching force-new-battle event');
          // Fallback to event dispatch if function ref not available
          document.dispatchEvent(new CustomEvent("force-new-battle", { 
            detail: { battleType: "pairs" }
          }));
        }
      } else {
        console.log('[DEBUG] Battle already exists after initialization:', currentBattle?.length || 0);
      }
      
    }, 1000);
    
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, [allPokemon, currentBattle]);

  useEffect(() => {
    console.log('[DEBUG useBattleStarterIntegration] useEffect EventListeners: Fired. currentRankingsLength:', currentRankings.length);
    
    const handlePrioritize = () => {
      suggestionBattleCountRef.current = 0;
      processedSuggestionBattlesRef.current.clear();

      const suggestedPokemon = currentRankings.filter(
        p => p.suggestedAdjustment && !p.suggestedAdjustment.used
      );

      totalSuggestionsRef.current = suggestedPokemon.length;
      forcedPriorityBattlesRef.current = Math.max(20, suggestedPokemon.length * 5);
      console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef set to:', forcedPriorityBattlesRef.current, 'after prioritize trigger');
      
      // Set priority mode active flag
      priorityModeActiveRef.current = suggestedPokemon.length > 0;
      console.log('[DEBUG useBattleStarterIntegration] priorityModeActiveRef set to:', priorityModeActiveRef.current);

      // Reset consecutive battles without new Pokémon when prioritizing
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
      
      // After milestone, we want to ensure focus on unranked Pokemon
      // Reset battles without new Pokémon counter to force variety
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    };

    // Handle battle created events to detect duplicate battles
    const handleBattleCreated = (event: CustomEvent) => {
      const { pokemonIds, timestamp, wasForced } = event.detail || {};
      if (!pokemonIds || !pokemonIds.length) return;
      
      console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: Received event. pokemonIds:', pokemonIds, 'wasForced:', wasForced);
      console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: previousBattleIds.current (useRef) before update:', previousBattleIds.current);
      
      console.log(`[${new Date().toISOString()}] Battle created event received. PokemonIds: [${pokemonIds.join(',')}], wasForced: ${wasForced}`);
      
      // Check if this is identical to previous battle
      const isIdentical = previousBattleIds.current.length > 0 && 
        pokemonIds.length === previousBattleIds.current.length &&
        pokemonIds.every(id => previousBattleIds.current.includes(id));
      
      console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: isIdentical check result:', isIdentical);
      console.log('[DEBUG] Battle created event received:', {
        pokemonIds,
        willUpdateState: !isIdentical,
        previousBattleIds: previousBattleIds.current
      });
      
      if (isIdentical && !wasForced) {
        identicalBattleCount.current++;
        console.warn(`⚠️ [useBattleStarterIntegration] Identical battle detected ${identicalBattleCount.current} times`);
        
        // If we've seen too many identical battles, reset
        if (identicalBattleCount.current >= 2) {
          console.warn('⚠️ Too many identical battles detected, triggering emergency reset');
          document.dispatchEvent(new CustomEvent('force-emergency-reset'));
          identicalBattleCount.current = 0;
          return; // Don't update previousBattleIds
        }
      } else {
        // Reset counter when we get a different battle
        identicalBattleCount.current = 0;
        // Note: We DO NOT update previousBattleIds.current here anymore!
        // This fixes the race condition - let setCurrentBattle do it instead
      }
      
      // Mark that we're no longer generating a battle
      setTimeout(() => {
        console.log('[DEBUG useBattleStarterIntegration] handleBattleCreated_EVENT: Setting battleGenerationInProgressRef.current = false.');
        battleGenerationInProgressRef.current = false;
        console.log(`[${new Date().toISOString()}] Battle generation marked as complete`);
      }, 100);
    };

    // Listen for events to handle external requests
    window.addEventListener("prioritizeSuggestions", handlePrioritize);
    window.addEventListener("milestoneEnded", handlePrioritize);
    window.addEventListener("milestoneReached", handleMilestoneReached);
    document.addEventListener("battle-created", handleBattleCreated as EventListener);

    // Add a force-new-battle event handler
    const handleForceNewBattle = (e: Event) => {
      const event = e as CustomEvent;
      const battleType = event.detail?.battleType || "pairs";
      console.log(`[${new Date().toISOString()}] Force new battle event received: ${battleType}`);
      
      // Reset identical battle counter
      identicalBattleCount.current = 0;
      
      // If we already have a battle generation in progress, don't start another
      if (battleGenerationInProgressRef.current) {
        console.log(`[${new Date().toISOString()}] Battle generation already in progress, ignoring force-new-battle event`);
        return;
      }
      
      // Reset the throttle timer to allow immediate battle generation
      lastBattleAttemptTimestampRef.current = 0;
      startNewBattle(battleType);
    };
    document.addEventListener("force-new-battle", handleForceNewBattle as EventListener);

    return () => {
      window.removeEventListener("prioritizeSuggestions", handlePrioritize);
      window.removeEventListener("milestoneEnded", handlePrioritize);
      window.removeEventListener("milestoneReached", handleMilestoneReached);
      document.removeEventListener("battle-created", handleBattleCreated as EventListener);
      document.removeEventListener("force-new-battle", handleForceNewBattle as EventListener);
    };
  }, [currentRankings]);

  // CRITICAL FIX: Only create battleStarter when we have Pokemon data
  const battleStarter = useMemo<ExtendedBattleStarter>(() => {
    console.log('[DEBUG battleStarterInstance useMemo] Evaluating with:');
    console.log('[DEBUG battleStarterInstance useMemo] allPokemon prop length:', allPokemon?.length || 0);
    console.log('[DEBUG battleStarterInstance useMemo] currentRankings prop length:', currentRankings?.length || 0);
    
    // CRITICAL FIX: Only create battleStarter if we have Pokemon data
    if (!allPokemon || allPokemon.length === 0) {
      console.log("[DEBUG battleStarterInstance useMemo] No Pokémon data available, returning empty battleStarter");
      const emptyInstance = createEmptyBattleStarter();
      console.log("[DEBUG battleStarterInstance useMemo] Created empty battleStarter:", emptyInstance ? "SUCCESS" : "FAILED");
      return emptyInstance;
    }

    console.log(`[DEBUG battleStarterInstance useMemo] Creating battleStarter with ${allPokemon.length} Pokémon and ${currentRankings.length} rankings`);
    
    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );

    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    console.log('[DEBUG battleStarterInstance useMemo] Identified pokemonWithSuggestions.length:', pokemonWithSuggestions.length);
    
    const battleStarterInstance = createBattleStarter(
      allPokemon,
      currentRankings
    );

    // Store the instance in our ref for future checks
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
    
    console.log("[DEBUG battleStarterInstance useMemo] Created and returning new extended battleStarter:", 
                extendedInstance ? "SUCCESS" : "FAILED");
    
    return extendedInstance;
  }, [
    allPokemon.length, // Only depend on length to avoid recreation on every ranking change
    currentRankings.length,
    setCurrentBattle
  ]);
  
  console.log('[DEBUG useBattleStarterIntegration] After useMemo - battleStarter exists:', 
              battleStarter ? "YES" : "NO", 
              'battleStarterRef exists:', battleStarterInstanceRef.current ? "YES" : "NO");

  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log('[DEBUG useBattleStarterIntegration] startNewBattle: Called. battleType:', battleType, 
                'initComplete:', initializationCompleteRef.current, 'genInProgress:', battleGenerationInProgressRef.current);
    
    console.log('[DEBUG] startNewBattle called:', {
      battleType,
      initComplete: initializationCompleteRef.current,
      genInProgress: battleGenerationInProgressRef.current,
      currentBattleLength: currentBattle?.length || 0,
      allPokemonLength: allPokemon?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    console.log('[DEBUG startNewBattle] Current battleStarter value:', 
                battleStarter ? 'DEFINED' : 'UNDEFINED', 
                typeof battleStarter);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] startNewBattle called with battleType: ${battleType}`);
    
    // CRITICAL FIX: Ensure we have Pokemon data before proceeding
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`[${timestamp}] No Pokemon data available, cannot start battle`);
      console.log('[DEBUG useBattleStarterIntegration] startNewBattle: No Pokemon data. Returning early.');
      return [];
    }
    
    const currentBattleStarter = battleStarter || createEmptyBattleStarter();
    console.log(`[${timestamp}] Using ${currentBattleStarter === battleStarter ? 'original' : 'fallback empty'} battleStarter`);
    
    startNewBattleRefFn.current = startNewBattle;
    
    if (!initializationCompleteRef.current) {
      console.log(`[${timestamp}] Skipping battle generation - initialization not complete`);
      console.log('[DEBUG useBattleStarterIntegration] startNewBattle: Initialization not complete. Returning early.');
      return [];
    }
    
    if (battleGenerationInProgressRef.current) {
      console.log(`[${timestamp}] Battle generation already in progress, ignoring startNewBattle call`);
      console.log('[DEBUG useBattleStarterIntegration] startNewBattle: Battle generation already in progress. Returning early.');
      return [];
    }
    
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
      console.log('[DEBUG useBattleStarterIntegration] startNewBattle: Throttled. Returning early.');
      battleGenerationInProgressRef.current = false;
      return [];
    }
    
    lastBattleAttemptTimestampRef.current = now;

    console.log(`[${timestamp}] Starting new battle with:`);
    console.log(`[${timestamp}] - allPokemon size: ${allPokemon.length}`);
    console.log(`[${timestamp}] - currentRankings size: ${currentRankings.length}`);
    
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
    console.log(`[${timestamp}] Starting new battle. Available suggestedPokemon.length:`, suggestedPokemon.length);
    console.log(`[${timestamp}] Current forcedPriorityBattlesRef.current:`, forcedPriorityBattlesRef.current);

    const shouldForcePriority = forcedPriorityBattlesRef.current > 0 && suggestedPokemon.length > 0;
    console.log(`[${timestamp}] shouldForcePriority decision:`, shouldForcePriority);
    
    priorityModeActiveRef.current = suggestedPokemon.length > 0 && forcedPriorityBattlesRef.current > 0;
    console.log(`[${timestamp}] priorityModeActiveRef updated to:`, priorityModeActiveRef.current);

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
    
    console.log('[DEBUG useBattleStarterIntegration] startNewBattle: About to call battleStarter.startNewBattle (from createBattleStarter instance).');
    console.log('[DEBUG] Double-check battleStarter before calling startNewBattle:', 
                'currentBattleStarter exists:', currentBattleStarter ? 'YES' : 'NO',
                'has startNewBattle function:', typeof currentBattleStarter.startNewBattle === 'function' ? 'YES' : 'NO');
    
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
    } catch (error) {
      console.error('[DEBUG] Error in battleStarter.startNewBattle:', error);
      battle = [];
      battleGenerationInProgressRef.current = false;
    }

    console.log('[DEBUG useBattleStarterIntegration] startNewBattle: Got battle from battleStarter.startNewBattle. IDs:', battle ? battle.map(p => p.id) : 'null/empty');

    if (!battle || battle.length === 0) {
      console.log(`[${timestamp}] Battle generation was throttled or failed, not updating state`);
      battleGenerationInProgressRef.current = false;
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

    return battle;
  }, [
    allPokemon,
    currentRankings,
    battleStarter,
    setSelectedPokemon,
    markSuggestionFullyUsed
  ]);

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
    console.log(`[${timestamp}] ⚡ Explicitly reset and forced suggestion prioritization for next battles`);
    
    milestoneCrossedRef.current = true;
    
    priorityModeActiveRef.current = true;
    console.log(`[${timestamp}] priorityModeActiveRef reset to: ${priorityModeActiveRef.current}`);
    
    consecutiveBattlesWithoutNewPokemonRef.current = 0;

    identicalBattleCount.current = 0;
    previousBattleIds.current = [];
  };

  useEffect(() => {
    console.log('[DEBUG useBattleStarterIntegration] useEffect InitialLoad: Fired.');
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration initial effect running`);
    
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
