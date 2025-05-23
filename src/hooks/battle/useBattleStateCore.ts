import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useBattleStarterIntegration } from "@/hooks/battle/useBattleStarterIntegration";
import { useBattleProcessor } from "@/hooks/battle/useBattleProcessor";
import { useProgressState } from "@/hooks/battle/useProgressState";
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleInteractions } from "./useBattleInteractions"; 
import { toast } from "@/hooks/use-toast";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  // Keep track if we need to reload suggestions after milestone
  const [needsToReloadSuggestions, setNeedsToReloadSuggestions] = useState(false);
  
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const initialBattleTypeStored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || initialBattleType;
  const [battleType, setBattleType] = useState<BattleType>(initialBattleTypeStored);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);

  // Flag to track when a full reset has just happened
  const isResettingRef = useRef(false);
  // Keep track of the last time suggestions were loaded
  const lastSuggestionLoadTimestampRef = useRef<number>(Date.now());
  // Avoid unnecessary regeneration of rankings
  const rankingsGenerationDelayRef = useRef<NodeJS.Timeout | null>(null);

  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones
  } = useProgressState();

  const {
    finalRankings,
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
  } = useRankings(allPokemon);

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
    allPokemon
  );

  // Filter Pokemon by generation if a specific generation is selected
  const filteredPokemon = allPokemon.filter(pokemon => {
    if (selectedGeneration === 0) {
      return true;
    }
    return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
  });

  console.log("🎯 [filteredPokemon] Count after filtering:", filteredPokemon.length, "Generation selected:", selectedGeneration);

  const { 
    battleStarter, 
    startNewBattle,
    resetSuggestionPriority 
  } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings, 
    setCurrentBattle,
    setSelectedPokemon
  );
  console.log("🎯 [useBattleStarterIntegration] initialized:", { battleStarter, currentBattle, filteredPokemonCount: filteredPokemon.length });

  // Get battle processor functions and state - now passing the integrated startNewBattle
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
    setCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon,
    activeTier,
    freezePokemonForTier,
    battleStarter,
    markSuggestionUsed,
    isResettingRef,
    startNewBattle // Pass the integrated startNewBattle function
  );
  console.log("🎯 [useBattleProcessor] initialized with battlesCompleted:", battlesCompleted, "currentBattle:", currentBattle);

  // Debounced version of generateRankings to avoid rapid re-renders
  const debouncedGenerateRankings = useCallback((results: any[]) => {
    if (rankingsGenerationDelayRef.current) {
      clearTimeout(rankingsGenerationDelayRef.current);
    }
    
    rankingsGenerationDelayRef.current = setTimeout(() => {
      console.log("[DEBOUNCED] Generating rankings after delay");
      generateRankings(results);
      rankingsGenerationDelayRef.current = null;
    }, 300); // 300ms delay to avoid rapid re-renders
  }, [generateRankings]);

  // NEW: Our centralized reset function that will be called from BattleControls
  const performFullBattleReset = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: Beginning full battle reset`);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: Current battlesCompleted before reset:`, battlesCompleted);
    
    // 1. Mark that we're resetting to ensure the next battle processing knows
    isResettingRef.current = true;
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: Set isResettingRef.current = true`);
    
    // 2. Reset all React state
    setBattlesCompleted(0);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ battlesCompleted explicitly reset to 0`);
    
    setBattleResults([]);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ battleResults reset to []`);
    
    setBattleHistory([]);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ battleHistory reset to []`);
    
    setSelectedPokemon([]);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ selectedPokemon reset to []`);
    
    setCompletionPercentage(0);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ completionPercentage reset to 0`);
    
    setRankingGenerated(false);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ rankingGenerated reset to false`);
    
    // 3. Reset milestones and suggestions
    resetMilestones();
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ useCompletionTracker's milestones reset (for snapshots)`);
    
    if (resetBattleProgressionMilestoneTracking) {
      resetBattleProgressionMilestoneTracking();
      console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ useBattleProgression's milestone tracking reset (for triggering)`);
    } else {
      console.warn(`🔄 [${timestamp}] CENTRALIZED RESET: resetBattleProgressionMilestoneTracking function not available!`);
    }
    
    clearAllSuggestions();
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ suggestions cleared`);
    
    // 4. Clear all relevant localStorage items
    const keysToRemove = [
      'pokemon-battle-count',
      'pokemon-battle-results',
      'pokemon-battle-history',
      'pokemon-active-suggestions',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'suggestionUsageCounts',
      'pokemon-battle-last-battle',
      'pokemon-ranker-battle-history'
    ];
    
    keysToRemove.forEach(key => {
      const previousValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ Removed ${key} from localStorage (was ${previousValue ? 'present' : 'empty'})`);
    });
    
    // 5. Generate empty rankings to reset the system
    generateRankings([]);
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: ✅ Generated empty rankings`);
    
    // 6. Start a new battle with current battle type
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: Starting new battle with type ${battleType}`);
    setTimeout(() => {
      startNewBattle(battleType);
      console.log(`🔄 [${timestamp}] CENTRALIZED RESET: New battle started`);
      
      // Show a success toast
      toast({
        title: "Battles Restarted",
        description: "All battles have been reset. You're starting from battle #1.",
        duration: 3000
      });
    }, 100);
    
    console.log(`🔄 [${timestamp}] CENTRALIZED RESET: Full reset completed`);
  }, [
    battlesCompleted,
    setBattlesCompleted, 
    setBattleResults, 
    setBattleHistory, 
    setSelectedPokemon,
    setCompletionPercentage,
    setRankingGenerated,
    resetMilestones,
    clearAllSuggestions,
    generateRankings,
    battleType,
    startNewBattle,
    resetBattleProgressionMilestoneTracking
  ]);

  // FIXED: VERIFICATION check for suggestions with reduced dependencies
  useEffect(() => {
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
  }, [showingMilestone, loadSavedSuggestions, currentBattle]);

  // FIXED: Enhanced effect with more controlled behavior and proper dependency management
  useEffect(() => {
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
    triggerSuggestionPrioritization,
    resetSuggestionPriority,
    debouncedGenerateRankings
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
    setCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
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
      // Any additional back logic here
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

  // Fixed handleContinueBattles implementation
  const handleContinueBattles = useCallback(() => {
    setShowingMilestone(false);
    console.log("🎯 [Continue Battles] Milestone display turned off, continuing battles.");

    if (resetMilestoneInProgress) {
      resetMilestoneInProgress();
    }
    
    // When continuing battles, explicitly prioritize any suggestions
    if (resetSuggestionPriority) {
      console.log("🚨 Resetting suggestion priority in handleContinueBattles");
      resetSuggestionPriority();
    }
    
    // Ensure we emit the milestoneEnded event to trigger suggestion prioritization
    setTimeout(() => {
      window.dispatchEvent(new Event("milestoneEnded"));
      
      // Start a new battle with current battle type (after event handling)
      setTimeout(() => {
        startNewBattle(battleType);
      }, 100);
    }, 0);
  }, [
    setShowingMilestone, 
    resetMilestoneInProgress, 
    resetSuggestionPriority,
    battleType, 
    startNewBattle
  ]);

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
