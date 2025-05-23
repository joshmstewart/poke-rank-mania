
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

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionFullyUsed?: (pokemon: RankedPokemon, fullyUsed: boolean) => void
) => {
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

  // Log initial value of forcedPriorityBattlesRef
  console.log('[DEBUG useBattleStarterIntegration] forcedPriorityBattlesRef initialized to:', forcedPriorityBattlesRef.current);
  
  // Initialize component state tracking
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration initialized with ${allPokemon.length} Pokémon`);
    
    // Mark initialization complete after a delay to allow other components to initialize
    const initTimer = setTimeout(() => {
      initializationCompleteRef.current = true;
      console.log(`[${new Date().toISOString()}] useBattleStarterIntegration initialization complete`);
    }, 1000);
    
    return () => clearTimeout(initTimer);
  }, [allPokemon.length]);

  useEffect(() => {
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
      
      console.log(`[${new Date().toISOString()}] Battle created event received. PokemonIds: [${pokemonIds.join(',')}], wasForced: ${wasForced}`);
      
      // Check if this is identical to previous battle
      const isIdentical = previousBattleIds.current.length > 0 && 
        pokemonIds.length === previousBattleIds.current.length &&
        pokemonIds.every(id => previousBattleIds.current.includes(id));
      
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
        // Update our tracking
        previousBattleIds.current = [...pokemonIds];
      }
      
      // Mark that we're no longer generating a battle
      setTimeout(() => {
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

  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) {
      console.log("[DEBUG useBattleStarterIntegration] No Pokémon available, can't create battleStarter");
      return null;
    }

    // Log detailed diagnostics about the Pokémon pools
    console.log(`[DEBUG useBattleStarterIntegration] Creating battleStarter with:`);
    console.log(`[DEBUG useBattleStarterIntegration] - allPokemon size: ${allPokemon.length}`);
    console.log(`[DEBUG useBattleStarterIntegration] - currentRankings size: ${currentRankings.length}`);
    
    // Count unranked Pokémon (in allPokemon but not in currentRankings)
    const rankedIds = new Set(currentRankings.map(p => p.id));
    const unrankedCount = allPokemon.filter(p => !rankedIds.has(p.id)).length;
    console.log(`[DEBUG useBattleStarterIntegration] - unranked Pokémon count: ${unrankedCount}`);
    
    // Detect if we have low variety in the current rankings
    if (currentRankings.length > 0 && currentRankings.length < 50 && allPokemon.length > 100) {
      console.log(`[DEBUG useBattleStarterIntegration] VARIETY WARNING: currentRankings (${currentRankings.length}) is much smaller than allPokemon (${allPokemon.length})`);
      console.log(`[DEBUG useBattleStarterIntegration] This indicates we need to draw more from unranked Pokémon`);
    }

    const pokemonWithSuggestions = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );

    totalSuggestionsRef.current = pokemonWithSuggestions.length;
    console.log('[DEBUG useBattleStarterIntegration] Identified pokemonWithSuggestions.length:', pokemonWithSuggestions.length);
    
    // CRUCIAL: Pass allPokemon to both allPokemon and availablePokemon parameters
    // This ensures createBattleStarter has access to the complete Pokémon pool
    return createBattleStarter(
      allPokemon,  // Full Pokémon pool 
      allPokemon,  // Same as full pool to ensure maximum variety
      currentRankings,
      (pokemonList) => {
        console.log(`[${new Date().toISOString()}] battleStarter.setCurrentBattle called with ${pokemonList.length} Pokémon`);
        
        // Ensure we're not setting identical battles
        if (areBattlesIdentical(pokemonList, previousBattleIds.current) && previousBattleIds.current.length > 0) {
          console.warn(`⚠️ Preventing setting identical battle! [${pokemonList.map(p => p.id).join(',')}]`);
          return; // Don't set the battle if it's identical to the previous one
        }
        
        setCurrentBattle(pokemonList);
      },
      pokemonWithSuggestions
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  const startNewBattle = useCallback((battleType: BattleType) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] startNewBattle called with battleType: ${battleType}`);
    
    // If initialization is not complete, don't start a battle yet
    if (!initializationCompleteRef.current) {
      console.log(`[${timestamp}] Skipping battle generation - initialization not complete`);
      return [];
    }
    
    // If we already have a battle generation in progress, don't start another
    if (battleGenerationInProgressRef.current) {
      console.log(`[${timestamp}] Battle generation already in progress, ignoring startNewBattle call`);
      return [];
    }
    
    if (!battleStarter) {
      console.log(`[${timestamp}] No battleStarter available, cannot start new battle`);
      return [];
    }
    
    // Mark that we're starting to generate a battle
    battleGenerationInProgressRef.current = true;
    
    // Track that we've fired the initial battle
    if (!initialGetBattleFiredRef.current) {
      initialGetBattleFiredRef.current = true;
      console.log(`[${timestamp}] Initial startNewBattle call`);
    }
    
    // Improved throttling with exponential backoff for repeated requests
    const now = Date.now();
    const timeSinceLastAttempt = now - lastBattleAttemptTimestampRef.current;
    
    // Base throttle time increases if we have recent identical battles
    const adjustedThrottleTime = throttleTimeMs * Math.pow(2, Math.min(3, identicalBattleCount.current));
    
    if (timeSinceLastAttempt < adjustedThrottleTime) {
      console.log(`[${timestamp}] Throttling battle generation. Last attempt: ${timeSinceLastAttempt}ms ago. Required interval: ${adjustedThrottleTime}ms`);
      battleGenerationInProgressRef.current = false;
      return [];
    }
    
    // Update the timestamp
    lastBattleAttemptTimestampRef.current = now;

    // CRITICAL DIAGNOSTICS: Log pool sizes before starting battles
    console.log(`[${timestamp}] Starting new battle with:`);
    console.log(`[${timestamp}] - allPokemon size: ${allPokemon.length}`);
    console.log(`[${timestamp}] - currentRankings size: ${currentRankings.length}`);
    
    // Count truly unranked Pokémon
    const rankedIds = new Set(currentRankings.map(p => p.id));
    const unrankedPokemon = allPokemon.filter(p => !rankedIds.has(p.id));
    console.log(`[${timestamp}] - unranked Pokémon count: ${unrankedPokemon.length}`);
    
    // If we've crossed a milestone, ensure we prioritize unranked Pokémon
    if (milestoneCrossedRef.current) {
      console.log(`[${timestamp}] Post-milestone battle. Will prioritize unranked Pokémon selection.`);
      // Reset the milestone flag so it's only used for the immediate post-milestone battle
      milestoneCrossedRef.current = false;
      // Also reset consecutive battles without new Pokémon
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    }

    const suggestedPokemon = currentRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    console.log(`[${timestamp}] Starting new battle. Available suggestedPokemon.length:`, suggestedPokemon.length);
    console.log(`[${timestamp}] Current forcedPriorityBattlesRef.current:`, forcedPriorityBattlesRef.current);

    // Only force priority if we have forced battles left AND suggestions available
    const shouldForcePriority = forcedPriorityBattlesRef.current > 0 && suggestedPokemon.length > 0;
    console.log(`[${timestamp}] shouldForcePriority decision:`, shouldForcePriority);
    
    // IMPORTANT: Update priorityModeActiveRef based on whether we still have suggestions
    priorityModeActiveRef.current = suggestedPokemon.length > 0 && forcedPriorityBattlesRef.current > 0;
    console.log(`[${timestamp}] priorityModeActiveRef updated to:`, priorityModeActiveRef.current);

    let battle: Pokemon[] = [];
    let forceUnrankedSelection = false;
    
    // CRITICAL FIX: Force unranked selection if we've gone too many battles without new Pokémon
    const MAX_BATTLES_WITHOUT_NEW_POKEMON = 3;
    if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
      forceUnrankedSelection = true;
      console.log(`[${timestamp}] FORCING unranked selection after ${consecutiveBattlesWithoutNewPokemonRef.current} battles without new Pokémon`);
    }
    
    // Check if we need to force unranked Pokemon selection for variety
    if (milestoneCrossedRef.current || 
        (unrankedPokemon.length > 0 && unrankedPokemon.length > (currentRankings.length * 9))) {
      forceUnrankedSelection = true;
      console.log(`[${timestamp}] Forcing unranked selection for variety:`, forceUnrankedSelection);
    }
    
    // Generate the battle
    if (shouldForcePriority) {
      console.log(`[${timestamp}] 🚨 Explicitly FORCING a suggestion-priority battle. forceUnrankedSelection: ${forceUnrankedSelection}`);
      battle = battleStarter.startNewBattle(battleType, true, forceUnrankedSelection);

      // Check if the battle includes a suggestion before decrementing the counter
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
        // IMPORTANT: Still decrement by at least 1 to avoid getting stuck
        if (forcedPriorityBattlesRef.current > 0) {
          forcedPriorityBattlesRef.current--;
          console.log(`[${timestamp}] Decrementing counter anyway to prevent stalling:`, forcedPriorityBattlesRef.current);
        }
      }
    } else {
      // Pass the forceUnrankedSelection flag to ensure variety
      console.log(`[${timestamp}] 🎮 Using standard battle selection (forceUnrankedSelection: ${forceUnrankedSelection})`);
      battle = battleStarter.startNewBattle(battleType, false, forceUnrankedSelection);
    }

    // If battle is empty (likely due to throttling), don't proceed
    if (!battle || battle.length === 0) {
      console.log(`[${timestamp}] Battle generation was throttled or failed, not updating state`);
      battleGenerationInProgressRef.current = false;
      return [];
    }

    // NEW: Check for suggestions marked as fully used by createBattleStarter
    // and persist this state using markSuggestionFullyUsed
    if (battle && markSuggestionFullyUsed) {
      battle.forEach(pokemonInBattle => {
        const pk = pokemonInBattle as RankedPokemon;
        if (pk.suggestedAdjustment && pk.suggestedAdjustment.used === true) {
          // This 'used === true' flag was set by createBattleStarter when count >= 2.
          // Because selectSuggestedPokemonForced filters for !used, if this Pokemon was selected
          // as a suggestion and is now marked .used = true, it means createBattleStarter just did it.
          console.log(`[${timestamp}] Detected ${pk.name} was marked as fully used by createBattleStarter. Persisting this state.`);
          markSuggestionFullyUsed(pk, true);
        }
      });
    }

    // DIAGNOSTICS: Check if battle contains suggestions or new Pokémon
    const hasSuggestionInBattle = battle.some(pokemon => {
      const rankedPokemon = currentRankings.find(p => p.id === pokemon.id);
      return rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used;
    });

    // Check if we're introducing new Pokémon
    const newPokemonCount = battle.filter(pokemon => !currentRankings.some(rp => rp.id === pokemon.id)).length;

    if (hasSuggestionInBattle) {
      suggestionBattleCountRef.current++;
      console.log(`[${timestamp}] ✅ Battle explicitly contains suggestion (#${suggestionBattleCountRef.current} since milestone).`);
      // Don't reset the consecutiveBattlesWithoutNewPokemonRef here - we're prioritizing suggestions
    } else if (newPokemonCount > 0) {
      console.log(`[${timestamp}] ✅ Battle introduces ${newPokemonCount} new Pokémon that weren't previously ranked.`);
      // Reset the counter since we're introducing new Pokémon
      consecutiveBattlesWithoutNewPokemonRef.current = 0;
    } else {
      console.log(`[${timestamp}] 🚫 Battle contains no suggestions and no new Pokémon explicitly.`);
      // Increment the counter since we didn't introduce new Pokémon
      consecutiveBattlesWithoutNewPokemonRef.current++;
      console.log(`[${timestamp}] ⚠️ Consecutive battles without new Pokémon: ${consecutiveBattlesWithoutNewPokemonRef.current}`);
      // IMPORTANT: Force unranked next time if we've gone too many battles without new Pokémon
      if (consecutiveBattlesWithoutNewPokemonRef.current >= MAX_BATTLES_WITHOUT_NEW_POKEMON) {
        console.log(`[${timestamp}] ⚠️ Will force unranked selection next battle to ensure variety`);
      }
    }

    // Reset selected Pokemon when starting a new battle
    setSelectedPokemon([]);
    console.log(`[${timestamp}] 📌 Cleared selected Pokemon`);

    // Only return battle if it's not empty
    return battle;
  }, [battleStarter, currentRankings, setCurrentBattle, allPokemon, markSuggestionFullyUsed, setSelectedPokemon]);

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
    
    // Also set milestoneCrossedRef to true to ensure we prioritize unranked Pokémon
    milestoneCrossedRef.current = true;
    
    // Reset priority mode flag
    priorityModeActiveRef.current = true;
    console.log(`[${timestamp}] priorityModeActiveRef reset to: ${priorityModeActiveRef.current}`);
    
    // Reset consecutive battles without new Pokémon counter
    consecutiveBattlesWithoutNewPokemonRef.current = 0;

    // Clear the identical battle detection
    identicalBattleCount.current = 0;
    previousBattleIds.current = [];
  };

  // Initialize the battle system once on mount
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useBattleStarterIntegration initial effect running`);
    
    // Mark initial load as not complete to prevent premature battle starts
    initializationCompleteRef.current = false;
    initialGetBattleFiredRef.current = false;
    
    // Allow initialization time to complete
    const timer = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] useBattleStarterIntegration initialization timer completed`);
      initializationCompleteRef.current = true;
    }, 1500);
    
    return () => {
      clearTimeout(timer);
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
