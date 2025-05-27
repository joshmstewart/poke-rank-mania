
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
  allPokemon: Pokemon[] = [],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  const { allPokemon: contextPokemon } = usePokemonContext();
  
  const initializationRef = useRef(false);
  const hookInstanceRef = useRef(`core-${Date.now()}`);
  const continueBattlesRef = useRef(false);
  
  // CRITICAL FIX: Add battle clearing state to prevent flash
  const [isBattleClearing, setIsBattleClearing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  if (!initializationRef.current) {
    console.log(`[DEBUG useBattleStateCore] INIT - Instance: ${hookInstanceRef.current} - Using context for Pokemon data`);
    initializationRef.current = true;
  }
  
  const stableInitialBattleType = useMemo(() => initialBattleType, []);
  const stableInitialGeneration = useMemo(() => initialSelectedGeneration, []);
  
  const [needsToReloadSuggestions, setNeedsToReloadSuggestions] = useState(false);
  
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(stableInitialGeneration);
  const initialBattleTypeStored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || stableInitialBattleType;
  const [battleType, setBattleType] = useState<BattleType>(initialBattleTypeStored);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);

  // CRITICAL FIX: Enhanced battle setter that manages clearing state
  const stableSetCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🔄 [FLASH_FIX] stableSetCurrentBattle called with ${battle.length} Pokemon`);
    
    if (battle.length > 0) {
      console.log(`✅ [FLASH_FIX] Setting new battle and clearing states: ${battle.map(p => p.name).join(', ')}`);
      setCurrentBattle(battle);
      setIsTransitioning(false);
      setIsBattleClearing(false); // Clear the clearing state when new battle is set
    } else {
      console.log(`⚠️ [FLASH_FIX] Clearing battle array and setting clearing state`);
      setIsBattleClearing(true); // Set clearing state when battle is cleared
      setCurrentBattle([]);
    }
  }, []);
  
  const stableSetSelectedPokemon = useCallback((pokemon: number[]) => {
    setSelectedPokemon(pokemon);
  }, []);

  const triggerSuggestionPrioritization = useCallback(() => {
    console.log('[DEBUG] Basic suggestion prioritization triggered');
  }, []);

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
  } = useRankings();

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

  // CRITICAL FIX: Enhanced battle starter with immediate synchronous state update
  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType}`);
    
    // Generate battle immediately
    const result = startNewBattle(battleType);
    
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated: ${result.map(p => p.name).join(', ')}`);
      // CRITICAL FIX: Set battle state SYNCHRONOUSLY
      stableSetCurrentBattle(result);
      
      return result;
    } else {
      console.log(`⚠️ [FLASH_FIX] Failed to generate new battle`);
    }
    
    return result;
  }, []);

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
    enhancedStartNewBattle
  );

  // CRITICAL FIX: Properly handle going back with battle clearing
  const goBack = useCallback(() => {
    console.log(`🔄 [BACK_FIX] goBack called`);
    
    if (battleHistory.length === 0) {
      toast({
        title: "No previous battles",
        description: "There are no previous battles to return to."
      });
      return;
    }

    // Clear current battle immediately to prevent flashing
    console.log(`🔄 [BACK_FIX] Clearing current battle before going back`);
    setIsBattleClearing(true);
    setCurrentBattle([]);
    setIsTransitioning(true);

    // Process the back navigation
    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);
    console.log("🔄 [BACK_FIX] Updated battle history. New length:", newHistory.length);

    const newResults = [...battleResults];
    let resultsToRemove = 1;
    if (battleType === "triplets" && lastBattle) {
      const selectedCount = lastBattle.selected.length;
      const unselectedCount = lastBattle.battle.length - selectedCount;
      resultsToRemove = selectedCount * unselectedCount;
    }

    newResults.splice(newResults.length - resultsToRemove, resultsToRemove);
    setBattleResults(newResults);
    setBattlesCompleted(prev => Math.max(0, prev - 1));

    if (lastBattle) {
      console.log(`🔄 [BACK_FIX] Restoring previous battle: ${lastBattle.battle.map(p => p.name).join(', ')}`);
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
      setIsTransitioning(false);
      setIsBattleClearing(false);
    }

    setShowingMilestone(false);
  }, [battleHistory, battleResults, battleType, setBattleHistory, setBattleResults, setBattlesCompleted, setSelectedPokemon, setShowingMilestone]);

  // CRITICAL FIX: Enhanced handleContinueBattles with proper state sequence
  const handleContinueBattles = useCallback(() => {
    console.log('[FLASH_FIX] handleContinueBattles: Called');
    
    // Prevent rapid successive calls
    if (continueBattlesRef.current) {
      console.log('[FLASH_FIX] handleContinueBattles: Already processing, ignoring');
      return;
    }
    
    continueBattlesRef.current = true;
    
    if (showingMilestone) {
      console.log('[FLASH_FIX] handleContinueBattles: Starting milestone transition sequence');
      
      // CRITICAL FIX: Set clearing state FIRST to prevent old battle rendering
      setIsBattleClearing(true);
      setIsTransitioning(true);
      
      // CRITICAL FIX: Use setTimeout to ensure state update before battle generation
      setTimeout(() => {
        // Clear old battle after state update
        setCurrentBattle([]);
        
        // Generate new battle immediately after clearing
        const newBattle = enhancedStartNewBattle("pairs");
        
        if (newBattle && newBattle.length > 0) {
          console.log(`✅ [FLASH_FIX] New battle ready: ${newBattle.map(p => p.name).join(', ')}`);
          
          // Dismiss milestone - clearing states will be handled by stableSetCurrentBattle
          forceDismissMilestone();
          resetMilestoneInProgress();
          
          console.log('✅ [FLASH_FIX] Milestone dismissed with new battle ready');
        } else {
          console.log('⚠️ [FLASH_FIX] Failed to generate new battle, clearing states');
          setIsTransitioning(false);
          setIsBattleClearing(false);
          forceDismissMilestone();
          resetMilestoneInProgress();
        }
        
        continueBattlesRef.current = false;
      }, 0); // Minimal delay to ensure state update
    } else {
      console.log('[FLASH_FIX] handleContinueBattles: Starting new battle directly');
      enhancedStartNewBattle("pairs");
      continueBattlesRef.current = false;
    }
  }, [showingMilestone, forceDismissMilestone, enhancedStartNewBattle, resetMilestoneInProgress]);

  // CRITICAL FIX: Remove milestone dismissed event listener - handle immediately instead

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
  }, []);

  const performFullBattleReset = useCallback(() => {
    console.log('🔄 CENTRALIZED RESET: Beginning full battle reset');
    
    isResettingRef.current = true;
    
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setSelectedPokemon([]);
    setCompletionPercentage(0);
    setRankingGenerated(false);
    
    resetMilestones();
    if (resetBattleProgressionMilestoneTracking) {
      resetBattleProgressionMilestoneTracking();
    }
    clearAllSuggestions();
    
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
      enhancedStartNewBattle("pairs");
      toast({
        title: "Battles Restarted",
        description: "All battles have been reset. You're starting fresh!",
        duration: 3000
      });
    }, 100);
  }, []);

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
  }, []);

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
      goBack(); // Use our enhanced goBack function
    },
    battleType,
    processBattleResult
  );

  // CRITICAL FIX: Include clearing state in processing check
  const isAnyProcessing = isProcessingResult || isBattleClearing;
  
  console.log(`🔄 [PROCESSOR_FIX] useBattleStateCore processing states:`, {
    isProcessingResult,
    isProcessing,
    isBattleClearing,
    isAnyProcessing,
    isTransitioning,
    timestamp: new Date().toISOString()
  });

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
    isBattleTransitioning: isTransitioning || isBattleClearing, // CRITICAL FIX: Include clearing state
    isAnyProcessing,
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
    goBack,
    isProcessingResult,
    startNewBattle: enhancedStartNewBattle,
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
    isTransitioning,
    isBattleClearing,
    isAnyProcessing,
    handlePokemonSelect,
    goBack,
    isProcessingResult,
    enhancedStartNewBattle,
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

export const ensureBattleIntegration = (
  battleStarterIntegration: any,
  currentBattle: any[]
) => {
  console.log('[DEBUG] ensureBattleIntegration called with currentBattle.length:', currentBattle?.length || 0);
  return true;
};
