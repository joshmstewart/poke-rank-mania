
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
  // CRITICAL FIX: Use Pokemon context for stable data and prevent re-initialization
  const { allPokemon: contextPokemon } = usePokemonContext();
  
  // CRITICAL FIX: Track initialization to prevent repeated INIT logs and logic
  const initializationRef = useRef(false);
  const hookInstanceRef = useRef(`core-${Date.now()}`);
  
  // Only log INIT once per instance
  if (!initializationRef.current) {
    console.log(`[DEBUG useBattleStateCore] INIT - Instance: ${hookInstanceRef.current} - Using context for Pokemon data`);
    initializationRef.current = true;
  }
  
  // CRITICAL FIX: Ultra-stable initial values to prevent re-initialization triggers
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

  // CRITICAL FIX: Completely stable callback references that NEVER change
  const stableSetCurrentBattle = useCallback((battle: Pokemon[]) => {
    setCurrentBattle(battle);
  }, []); // NO dependencies - truly stable
  
  const stableSetSelectedPokemon = useCallback((pokemon: number[]) => {
    setSelectedPokemon(pokemon);
  }, []); // NO dependencies - truly stable

  // CRITICAL: Simple suggestion prioritization function - no external dependencies
  const triggerSuggestionPrioritization = useCallback(() => {
    console.log('[DEBUG] Basic suggestion prioritization triggered');
  }, []); // NO dependencies - truly stable

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

  // CRITICAL FIX: Use stable context Pokemon reference with proper memoization
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
  } = useRankings(); // No parameters - will use context internally

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

  // CRITICAL FIX: Stable filtered Pokemon with ultra-stable memoization
  const filteredPokemon = useMemo(() => {
    const filtered = (contextPokemon || []).filter(pokemon => {
      if (selectedGeneration === 0) {
        return true;
      }
      return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
    });
    
    console.log(`[DEBUG useBattleStateCore] Filtered Pokemon: ${filtered.length} for generation ${selectedGeneration}`);
    return filtered;
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

  // CRITICAL FIX: Ultra-stable milestone continue handler with NO dependencies
  const handleContinueBattles = useCallback(() => {
    console.log('[DEBUG useBattleStateCore] handleContinueBattles: Called');
    
    // Use refs and getters to avoid dependencies
    if (showingMilestone) {
      console.log('[DEBUG useBattleStateCore] handleContinueBattles: Dismissing milestone first');
      forceDismissMilestone();
      
      setTimeout(() => {
        startNewBattle("pairs"); // Use hardcoded default to avoid dependency
      }, 100);
    } else {
      console.log('[DEBUG useBattleStateCore] handleContinueBattles: Starting new battle directly');
      startNewBattle("pairs"); // Use hardcoded default to avoid dependency
    }
  }, []); // NO dependencies - truly stable

  // CRITICAL FIX: Completely stable debounced rankings generation
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
  }, []); // No dependencies - truly stable

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
      startNewBattle("pairs");
      toast({
        title: "Battles Restarted",
        description: "All battles have been reset. You're starting fresh!",
        duration: 3000
      });
    }, 100);
  }, []); // Ultra-stable - no dependencies

  // CRITICAL FIX: Minimal effect with stable dependencies
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
        lastSuggestionLoadTimestampRef.current = Date.now();
        
        const loadedSuggestions = loadSavedSuggestions();
        console.log(`⭐ useBattleStateCore: Initial load: Loaded ${loadedSuggestions.size} suggestions`);
        
        if (battleResults.length > 0) {
          console.log("⚙️ useBattleStateCore: Triggering initial generateRankings to apply loaded suggestions");
          debouncedGenerateRankings(battleResults);
        }
      } catch (e) {
        console.error("Error parsing saved suggestions:", e);
      }
    }
  }, []); // NO dependencies - only run once on mount

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

  // CRITICAL FIX: Memoize the entire return object to prevent unnecessary re-renders
  return useMemo(() => ({
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
  }), [
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone,
    selectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    handlePokemonSelect,
    goBackHelper,
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
    performFullBattleReset,
    processBattleResult
  ]);
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
