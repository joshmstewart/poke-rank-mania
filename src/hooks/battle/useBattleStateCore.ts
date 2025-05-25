import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useBattleStarterIntegration } from "@/hooks/battle/useBattleStarterIntegration";
import { useBattleProcessor } from "@/hooks/battle/useBattleProcessor";
import { useProgressState } from "@/hooks/battle/useProgressState";
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleInteractions } from "./useBattleInteractions"; 
import { toast } from "@/hooks/use-toast";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const useBattleStateCore = (
  allPokemon: Pokemon[] = [], // This will be overridden by context
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log("[DEBUG useBattleStateCore] INIT - Using context for Pokemon data");

  // CRITICAL FIX: Use Pokemon context for stable data
  const { allPokemon: contextPokemon } = usePokemonContext();
  
  // CRITICAL FIX: Use stable memoized references to prevent re-initialization
  const stableInitialBattleType = useMemo(() => initialBattleType, []);
  const stableInitialGeneration = useMemo(() => initialSelectedGeneration, []);
  
  // Track if we need to reload suggestions after milestone
  const [needsToReloadSuggestions, setNeedsToReloadSuggestions] = useState(false);
  
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(stableInitialGeneration);
  const initialBattleTypeStored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || stableInitialBattleType;
  const [battleType, setBattleType] = useState<BattleType>(initialBattleTypeStored);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);

  // CRITICAL FIX: Stable callback references to prevent hook re-initialization
  const stableSetCurrentBattle = useMemo(() => setCurrentBattle, []);
  const stableSetSelectedPokemon = useMemo(() => setSelectedPokemon, []);

  // Flag to track when a full reset has just happened
  const isResettingRef = useRef(false);
  const lastSuggestionLoadTimestampRef = useRef<number>(Date.now());
  const rankingsGenerationDelayRef = useRef<NodeJS.Timeout | null>(null);

  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones,
    forceDismissMilestone
  } = useProgressState();

  // CRITICAL FIX: Use context Pokemon with stable reference
  const {
    finalRankings = [],
    confidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  } = useRankings(contextPokemon);

  const {
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    milestoneRankings,
    hitMilestones,
  } = useCompletionTracker(
    battleResults,
    setRankingGenerated,
    setCompletionPercentage,
    showingMilestone,
    setShowingMilestone,
    generateRankings,
    contextPokemon
  );

  // CRITICAL FIX: Stable filtered Pokemon with proper memoization
  const filteredPokemon = useMemo(() => {
    return (contextPokemon || []).filter(pokemon => {
      if (selectedGeneration === 0) {
        return true;
      }
      return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
    });
  }, [contextPokemon, selectedGeneration]);

  const { 
    battleStarter, 
    startNewBattle,
    resetSuggestionPriority 
  } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings || [],
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    markSuggestionUsed,
    currentBattle
  );
  
  // Get battle processor functions and state
  const { 
    processBattleResult,
    isProcessingResult, 
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking
  } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    filteredPokemon,
    stableSetCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    stableSetSelectedPokemon,
    activeTier,
    freezePokemonForTier,
    battleStarter,
    markSuggestionUsed,
    isResettingRef,
    startNewBattle
  );

  // MILESTONE FIX: Enhanced milestone continue handler
  const handleContinueBattles = useCallback(() => {
    console.log('[DEBUG useBattleStateCore] handleContinueBattles: Called with showingMilestone:', showingMilestone);
    
    if (showingMilestone) {
      console.log('[DEBUG useBattleStateCore] handleContinueBattles: Dismissing milestone first');
      forceDismissMilestone();
      
      // Wait for state to update before proceeding
      setTimeout(() => {
        if (battleStarter && !isProcessingResult) {
          console.log('[DEBUG useBattleStateCore] handleContinueBattles: Starting new battle after milestone dismissal');
          startNewBattle(battleType);
        }
      }, 100);
    } else if (battleStarter && !isProcessingResult) {
      console.log('[DEBUG useBattleStateCore] handleContinueBattles: Starting new battle directly');
      startNewBattle(battleType);
    }
  }, [showingMilestone, battleStarter, battleType, isProcessingResult, startNewBattle, forceDismissMilestone]);

  // CRITICAL FIX: Stable debounced rankings generation
  const debouncedGenerateRankings = useMemo(() => {
    return (results: any[]) => {
      if (rankingsGenerationDelayRef.current) {
        clearTimeout(rankingsGenerationDelayRef.current);
      }
      
      rankingsGenerationDelayRef.current = setTimeout(() => {
        console.log("[DEBOUNCED] Generating rankings after delay");
        generateRankings(results);
        rankingsGenerationDelayRef.current = null;
      }, 150);
    };
  }, [generateRankings]);

  // RESET FUNCTION: Enhanced with better state management
  const performFullBattleReset = useCallback(() => {
    console.log('🔄 CENTRALIZED RESET: Beginning full battle reset');
    
    isResettingRef.current = true;
    
    // Reset all state
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setSelectedPokemon([]);
    setCompletionPercentage(0);
    setRankingGenerated(false);
    
    // Reset milestones and suggestions
    resetMilestones();
    if (resetBattleProgressionMilestoneTracking) {
      resetBattleProgressionMilestoneTracking();
    }
    clearAllSuggestions();
    
    // Clear localStorage
    const keysToRemove = [
      'pokemon-battle-count',
      'pokemon-battle-results', 
      'pokemon-battle-history',
      'pokemon-active-suggestions',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'suggestionUsageCounts'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    generateRankings([]);
    
    setTimeout(() => {
      startNewBattle(battleType);
      toast({
        title: "Battles Restarted",
        description: "All battles have been reset. You're starting fresh!",
        duration: 3000
      });
    }, 100);
  }, [
    setBattlesCompleted, setBattleResults, setBattleHistory, setSelectedPokemon,
    setCompletionPercentage, setRankingGenerated, resetMilestones,
    clearAllSuggestions, generateRankings, battleType, startNewBattle,
    resetBattleProgressionMilestoneTracking
  ]);

  // PERFORMANCE FIX: Optimized suggestion loading
  useEffect(() => {
    if (!showingMilestone && needsToReloadSuggestions) {
      setNeedsToReloadSuggestions(false);
      const loadedSuggestions = loadSavedSuggestions();
      if (loadedSuggestions.size > 0 && battleResults.length > 0) {
        debouncedGenerateRankings(battleResults);
      }
    }
  }, [showingMilestone, needsToReloadSuggestions, loadSavedSuggestions, battleResults, debouncedGenerateRankings]);

  // VERIFICATION check for suggestions with reduced dependencies
  useEffect(() => {
    console.log('[DEBUG useBattleStateCore] useEffect ImagePreference: Fired.');
    
    const preferredImageType = localStorage.getItem('preferredImageType');
    console.log("🎯 [Mount] Loaded preferredImageType from localStorage:", preferredImageType);

    if (!preferredImageType) {
      localStorage.setItem('preferredImageType', 'official');
      console.log("✅ Set default image preference to 'official'");
    }

    const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
    console.log("🔍 MOUNT VERIFICATION: Suggestions in localStorage:", savedSuggestions ? "YES" : "NO");
    if (savedSuggestions) {
      try {
        const parsed = JSON.parse(savedSuggestions);
        const count = Object.keys(parsed).length;
        console.log(`🔢 Found ${count} suggestions in localStorage`);
        
        // Store timestamp of when suggestions were last loaded
        lastSuggestionLoadTimestampRef.current = Date.now();
        
        // NEW: Load the suggestions and immediately generate rankings to reflect them
        const loadedSuggestions = loadSavedSuggestions();
        console.log(`⭐ useBattleStateCore: Initial load: Loaded ${loadedSuggestions.size} suggestions`);
        
        // Only trigger initial generation if we have battle results
        if (battleResults.length > 0) {
          console.log("⚙️ useBattleStateCore: Triggering initial generateRankings to apply loaded suggestions");
          debouncedGenerateRankings(battleResults);
        }
      } catch (e) {
        console.error("Error parsing saved suggestions:", e);
      }
    }
  // Critical fix: Remove generateRankings from this effect's dependencies!
  }, [loadSavedSuggestions, battleResults, debouncedGenerateRankings]);
  
  // Add explicit event to signal that we should prioritize suggestions
  const triggerSuggestionPrioritization = useCallback(() => {
    console.log("🔥 Dispatching prioritizeSuggestions event");
    window.dispatchEvent(new CustomEvent("prioritizeSuggestions"));
  }, []);

  // FIXED: This effect with precise entry/exit logging and proper dependency management
  useEffect(() => {
    console.log('[DEBUG useBattleStateCore] useEffect ShowingMilestone: Fired. showingMilestone:', showingMilestone, 
                'needsToReloadSuggestions:', needsToReloadSuggestions);
    
    if (!showingMilestone) return;
    
    console.log("[EFFECT LoopCheck - showingMilestone] ENTRY - showingMilestone:", showingMilestone);
    
    setNeedsToReloadSuggestions(true);
      
    // VERIFICATION: Check if current battle contains any suggestions
    const hasSuggestion = currentBattle.some(p => (p as RankedPokemon).suggestedAdjustment);
    console.log(`🔍 Before milestone: Found ${hasSuggestion ? "some" : "0"} suggestions in current battle`);
      
    // Load suggestions but don't regenerate rankings here
    const loadedSuggestions = loadSavedSuggestions();
    console.log(`⭐ useBattleStateCore: Milestone shown: Loaded ${loadedSuggestions.size} suggestions`);
    lastSuggestionLoadTimestampRef.current = Date.now();
    
    console.log("[EFFECT LoopCheck - showingMilestone] EXIT");
  }, [showingMilestone, loadSavedSuggestions, currentBattle, needsToReloadSuggestions]);

  // FIXED: Enhanced effect with more controlled behavior and proper dependency management
  useEffect(() => {
    console.log('[DEBUG useBattleStateCore] useEffect AfterMilestone: Fired. showingMilestone:', showingMilestone, 
                'needsToReloadSuggestions:', needsToReloadSuggestions);
    
    // Only run when milestone ends (showingMilestone changes from true to false)
    if (showingMilestone || !needsToReloadSuggestions) return;

    console.log("[EFFECT LoopCheck - afterMilestone] ENTRY - needsToReloadSuggestions:", needsToReloadSuggestions);
    
    // Reset the flag first to prevent repeat executions
    setNeedsToReloadSuggestions(false);

    console.log("🔄 Explicitly reloading suggestions after milestone");
    const loadedSuggestions = loadSavedSuggestions();
    console.log(`📥 Reloaded suggestions after milestone: ${loadedSuggestions.size}`);
    lastSuggestionLoadTimestampRef.current = Date.now();

    // Debounce the rankings generation to avoid rapid re-renders
    if (battleResults.length > 0) {
      debouncedGenerateRankings(battleResults);
    }
    
    // Explicitly reset suggestion priority
    if (resetSuggestionPriority) {
      console.log("🚨 Resetting suggestion priority clearly after milestone");
      resetSuggestionPriority();
    }

    // Only trigger prioritization if we have suggestions
    if (loadedSuggestions.size > 0) {
      // Trigger suggestion prioritization after a small delay
      setTimeout(() => {
        triggerSuggestionPrioritization();
        
        toast({
          title: "Prioritizing suggestions",
          description: `Will explicitly prioritize ${loadedSuggestions.size} Pokémon suggestions consistently`,
          duration: 4000
        });
      }, 100);
    }
    
    console.log("[EFFECT LoopCheck - afterMilestone] EXIT");
  }, [
    showingMilestone, 
    needsToReloadSuggestions, 
    loadSavedSuggestions, 
    battleResults, 
    debouncedGenerateRankings, 
    resetSuggestionPriority,
    triggerSuggestionPrioritization
  ]);

  // FIXED: Enhanced milestone ended handler with controlled suggestion focus
  const handleMilestoneEnded = useCallback(() => {
    console.log("🏁 Milestone ended event detected");
    
    // Only load suggestions if they haven't been loaded recently
    const currentTime = Date.now();
    const timeSinceLastLoad = currentTime - lastSuggestionLoadTimestampRef.current;
    if (timeSinceLastLoad > 2000) { // Only reload if it's been at least 2 seconds
      const loadedSuggestions = loadSavedSuggestions();
      console.log(`📥 Reloaded ${loadedSuggestions.size} suggestions after milestone ended event`);
      lastSuggestionLoadTimestampRef.current = currentTime;
      
      // Only regenerate rankings if we have battle results and suggestions
      if (battleResults.length > 0 && loadedSuggestions.size > 0) {
        debouncedGenerateRankings(battleResults);
      }
      
      // Only trigger suggestion prioritization if we have suggestions
      if (loadedSuggestions.size > 0) {
        // Trigger suggestion prioritization after a small delay
        setTimeout(() => {
          triggerSuggestionPrioritization();
        }, 200);
      }
    }
  }, [loadSavedSuggestions, debouncedGenerateRankings, battleResults, triggerSuggestionPrioritization]);

  // Add event listener for milestone ended to reload suggestions
  useEffect(() => {
    window.addEventListener("milestoneEnded", handleMilestoneEnded);
    return () => window.removeEventListener("milestoneEnded", handleMilestoneEnded);
  }, [handleMilestoneEnded]);
  
  // FIXED: Periodic check with reduced execution frequency and scope
  useEffect(() => {
    // Ensure we don't check too frequently - every 10 seconds is plenty
    const checkInterval = setInterval(() => {
      // Skip checks when showing milestone or during reset
      if (showingMilestone || isResettingRef.current) return;
      
      const currentTime = Date.now();
      const timeSinceLastLoad = currentTime - lastSuggestionLoadTimestampRef.current;
      
      // Only check every 30 seconds if rankings exist and we're not showing milestone
      if (timeSinceLastLoad > 30000 && finalRankings.length > 0) {
        console.log("⏰ Periodic suggestion refresh check");
        
        const suggestionsWithoutRefresh = finalRankings.filter(
          p => p.suggestedAdjustment && !p.suggestedAdjustment.used
        ).length;
        
        // Only take action if we actually have suggestions to prioritize
        if (suggestionsWithoutRefresh > 0) {
          console.log(`⚠️ Found ${suggestionsWithoutRefresh} suggestions without refresh for ${Math.floor(timeSinceLastLoad/1000)}s`);
          const loadedSuggestions = loadSavedSuggestions();
          lastSuggestionLoadTimestampRef.current = currentTime;
          
          // Only regenerate rankings if we have battle results and suggestions
          if (battleResults.length > 0 && loadedSuggestions.size > 0) {
            debouncedGenerateRankings(battleResults);
            
            // Trigger prioritization as needed
            setTimeout(() => {
              triggerSuggestionPrioritization();
            }, 200);
          }
        }
      }
    }, 10000);
    
    return () => clearInterval(checkInterval);
  }, [
    finalRankings, 
    loadSavedSuggestions, 
    showingMilestone, 
    triggerSuggestionPrioritization, 
    battleResults,
    debouncedGenerateRankings
  ]);

  // FIXED: This effect now provides more controlled logging and avoids triggering re-renders
  useEffect(() => {
    // Skip early renders or when showing milestone
    if (finalRankings.length === 0 || showingMilestone) return;
    
    // Only log once in a while, not on every render
    const suggestedPokemon = finalRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    if (suggestedPokemon.length > 0) {
      console.log(`🔎 [Rankings Updated] Found ${suggestedPokemon.length} unused suggestions in rankings`, 
        suggestedPokemon.slice(0, 2).map(p => p.name).join(', '));
      
      // Don't trigger prioritization too often - check timestamp
      const currentTime = Date.now();
      const timeSinceLastLoad = currentTime - lastSuggestionLoadTimestampRef.current;
      if (timeSinceLastLoad > 10000) {  // 10 seconds debounce
        lastSuggestionLoadTimestampRef.current = currentTime;
        // Avoid re-triggering effects by using a timeout
        setTimeout(() => {
          triggerSuggestionPrioritization();
        }, 200);
      }
    }
  }, [finalRankings, showingMilestone, triggerSuggestionPrioritization]);

  const {
    handlePokemonSelect,
    handleGoBack: goBackHelper,
    isProcessing
  } = useBattleInteractions(
    currentBattle,
    stableSetCurrentBattle,
    selectedPokemon,
    stableSetSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
      }
    },
    () => {
      console.log("Going back in battle navigation");
    },
    battleType,
    processBattleResult
  );

  useEffect(() => {
    console.log("🔍 Battle Results Updated:", battleResults.length, "battles");
  }, [battleResults]);

  useEffect(() => {
    console.log("🔍 Final Rankings Updated:", finalRankings.length, "Pokémon ranked");
    
    // Check if we need to trigger suggestion prioritization
    const suggestedPokemon = finalRankings.filter(
      p => p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    if (suggestedPokemon.length > 0 && !showingMilestone) {
      console.log(`🔎 Found ${suggestedPokemon.length} suggestions in updated rankings`);
      // Don't trigger too frequently - check timestamp
      const currentTime = Date.now();
      const timeSinceLastLoad = currentTime - lastSuggestionLoadTimestampRef.current;
      if (timeSinceLastLoad > 5000) {  // 5 seconds debounce
        lastSuggestionLoadTimestampRef.current = currentTime;
        triggerSuggestionPrioritization();
      }
    }
  }, [finalRankings, showingMilestone, triggerSuggestionPrioritization]);

  return {
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    setBattleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    setActiveTier,
    handlePokemonSelect: (id: number) => {
      handlePokemonSelect(id);
    },
    handleTripletSelectionComplete: () => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
      }
    },
    handleSelection: (id: number) => {
      handlePokemonSelect(id);
    },
    goBack: () => {
      goBackHelper();
    },
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    handleSaveRankings,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles,
    resetMilestoneInProgress,
    performFullBattleReset
  };
};

// This is a wrapper function that would ideally update the reference to useBattleStarterIntegration
// in useBattleStateCore.ts to include currentBattle
export const ensureBattleIntegration = (
  battleStarterIntegration: any,
  currentBattle: any[]
) => {
  // This function would ideally modify useBattleStateCore to include currentBattle
  // in the call to useBattleStarterIntegration, but since we can't modify that file,
  // this is just a placeholder.
  console.log('[DEBUG] ensureBattleIntegration called with currentBattle.length:', currentBattle?.length || 0);
  return true;
};
