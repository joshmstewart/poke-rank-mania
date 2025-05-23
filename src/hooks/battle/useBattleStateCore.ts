
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

  // ✅ Correct logging placement AFTER filteredPokemon is fully defined
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

  // VERIFICATION: Check if suggestions exist in localStorage on mount
  useEffect(() => {
    const preferredImageType = localStorage.getItem('preferredImageType');
    console.log("🎯 [Mount] Loaded preferredImageType from localStorage:", preferredImageType);

    console.log("🎯 Loaded initial image preference:", preferredImageType);

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
        
        // Ensure finalRankings reflects these loaded suggestions before any battles
        console.log("⚙️ useBattleStateCore: Triggering initial generateRankings to apply loaded suggestions");
        generateRankings(battleResults); // This will ensure suggestions are immediately reflected
      } catch (e) {
        console.error("Error parsing saved suggestions:", e);
      }
    }
  }, [loadSavedSuggestions, generateRankings, battleResults]);
  
  // Add explicit event to signal that we should prioritize suggestions
  const triggerSuggestionPrioritization = useCallback(() => {
    console.log("🔥 Dispatching prioritizeSuggestions event");
    window.dispatchEvent(new CustomEvent("prioritizeSuggestions"));
  }, []);

  // This effect ensures that when we show a milestone, we mark that we need to reload suggestions
  // when we continue battling
  useEffect(() => {
    if (showingMilestone) {
      console.log("🔄 useBattleStateCore: Milestone shown, marking to reload suggestions when continuing");
      setNeedsToReloadSuggestions(true);
      
      // VERIFICATION: Check if current battle contains any suggestions
      const hasSuggestion = currentBattle.some(p => (p as RankedPokemon).suggestedAdjustment);
      console.log(`🔍 Before milestone: Found ${hasSuggestion ? "some" : "0"} suggestions in current battle`);
      
      // We should also reload suggestions here to ensure they're properly loaded into finalRankings
      setTimeout(() => {
        console.log("🧮 Generating milestone rankings (preserving suggestions)");
        const loadedSuggestions = loadSavedSuggestions();
        console.log(`⭐ useBattleStateCore: Milestone shown: Loaded ${loadedSuggestions.size} suggestions`);
        
        // NEW: Immediately generate rankings to ensure suggestions are reflected
        console.log("⚙️ useBattleStateCore: Triggering milestone generateRankings to apply loaded suggestions");
        generateRankings(battleResults);
        
        lastSuggestionLoadTimestampRef.current = Date.now();
      }, 0);
    }
  }, [showingMilestone, loadSavedSuggestions, currentBattle, generateRankings, battleResults]);
  
  // Enhanced effect to reload suggestions and trigger prioritization after milestone
  useEffect(() => {
    if (!showingMilestone && needsToReloadSuggestions) {
      console.log("🎯 [Milestone Ended] Reloading suggestions explicitly. Current needsToReloadSuggestions state:", needsToReloadSuggestions);

      console.log("🔄 Explicitly reloading suggestions after milestone");
      const loadedSuggestions = loadSavedSuggestions();
      console.log(`📥 Reloaded suggestions after milestone: ${loadedSuggestions.size}`);
      lastSuggestionLoadTimestampRef.current = Date.now();

      // NEW: Explicitly regenerate rankings with suggestions
      console.log("⚙️ Explicitly regenerating rankings after milestone to reflect suggestions");
      generateRankings(battleResults);
      
      setNeedsToReloadSuggestions(false);
      
      // Explicitly reset suggestion priority clearly and thoroughly
      if (resetSuggestionPriority) {
        console.log("🚨 Resetting suggestion priority clearly after milestone");
        resetSuggestionPriority();
      }

      // Immediate trigger suggestion prioritization
      triggerSuggestionPrioritization();

      // Immediate feedback clearly
      if (loadedSuggestions.size > 0) {
        toast({
          title: "Prioritizing suggestions",
          description: `Will explicitly prioritize ${loadedSuggestions.size} Pokémon suggestions consistently`,
          duration: 4000
        });
      }
    }
  }, [
    showingMilestone, 
    needsToReloadSuggestions, 
    loadSavedSuggestions, 
    generateRankings, 
    battleResults, 
    triggerSuggestionPrioritization,
    resetSuggestionPriority
  ]);

  // Enhanced milestone ended handler with stronger suggestion focus
  const handleMilestoneEnded = useCallback(() => {
    console.log("🏁 Milestone ended event detected, reloading suggestions");
    const loadedSuggestions = loadSavedSuggestions();
    console.log(`📥 Reloaded ${loadedSuggestions.size} suggestions after milestone ended event`);
    lastSuggestionLoadTimestampRef.current = Date.now();
    
    // NEW: Also regenerate rankings to ensure they include suggestions
    console.log("⚙️ Explicitly regenerating rankings after milestone ended event");
    generateRankings(battleResults);
    
    // Explicitly trigger suggestion prioritization
    setTimeout(() => {
      console.log("🔄 Triggering suggestion prioritization after milestone");
      triggerSuggestionPrioritization();
    }, 200);
    
    // Restart battles with currently loaded suggestions
    if (loadedSuggestions.size > 0) {
      console.log("🔄 Actively prioritizing suggestion battles after milestone");
    }
  }, [loadSavedSuggestions, generateRankings, battleResults, triggerSuggestionPrioritization]);

  // Add event listener for milestone ended to reload suggestions
  useEffect(() => {
    window.addEventListener("milestoneEnded", handleMilestoneEnded);
    return () => window.removeEventListener("milestoneEnded", handleMilestoneEnded);
  }, [handleMilestoneEnded]);
  
  // Periodically check if suggestions have been refreshed recently
  useEffect(() => {
    const checkInterval = setInterval(() => {
      console.log("🎯 [Periodic Check] Checking suggestion refresh status. Current final rankings length:", finalRankings.length);

      const currentTime = Date.now();
      const timeSinceLastLoad = currentTime - lastSuggestionLoadTimestampRef.current;
      // If it's been more than 30 seconds since suggestions were loaded
      if (timeSinceLastLoad > 30000 && finalRankings.length > 0 && !showingMilestone) {
        console.log("⏰ Periodic suggestion refresh check");
        const suggestionsWithoutRefresh = finalRankings.filter(
          p => p.suggestedAdjustment && !p.suggestedAdjustment.used
        ).length;
        
        if (suggestionsWithoutRefresh > 0) {
          console.log(`⚠️ Found ${suggestionsWithoutRefresh} suggestions without refresh for ${Math.floor(timeSinceLastLoad/1000)}s`);
          const loadedSuggestions = loadSavedSuggestions();
          lastSuggestionLoadTimestampRef.current = currentTime;
          
          // NEW: Regenerate rankings after loading suggestions
          console.log("⚙️ Regenerating rankings after periodic suggestion refresh");
          generateRankings(battleResults);
          
          // If not currently showing milestone, trigger prioritization
          if (!showingMilestone) {
            triggerSuggestionPrioritization();
          }
        }
      }
    }, 10000);
    
    return () => clearInterval(checkInterval);
  }, [finalRankings, loadSavedSuggestions, showingMilestone, triggerSuggestionPrioritization, generateRankings, battleResults]);

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
    console.log("🎯 [Rankings Updated] Checking for unused suggestions in final rankings:", finalRankings.filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used));
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

  // Fixed handleContinueBattles implementation to not reference undefined processorRefs
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
    handlePokemonSelect,
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
    performFullBattleReset  // Export the centralized reset function
  };
};
