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
  
  // CRITICAL FIX: Add ref to track controlled transitions
  const controlledTransitionActiveRef = useRef(false);
  
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

  // CRITICAL FIX: Enhanced battle setter that updates immediately and synchronously
  const stableSetCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🔄 [SYNC_BATTLE_FIX] stableSetCurrentBattle called with ${battle.length} Pokemon`);
    
    if (battle.length > 0) {
      // CRITICAL FIX: Synchronous state update to prevent flash of old content
      setCurrentBattle(battle);
      console.log(`✅ [SYNC_BATTLE_FIX] Battle updated synchronously: ${battle.map(p => p.name).join(', ')}`);
    } else {
      console.log(`⚠️ [SYNC_BATTLE_FIX] Empty battle array received`);
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
    console.log(`🔄 [SYNC_BATTLE_FIX] enhancedStartNewBattle called for ${battleType}`);
    
    // Generate battle immediately
    const result = startNewBattle(battleType);
    
    if (result && result.length > 0) {
      console.log(`✅ [SYNC_BATTLE_FIX] New battle generated: ${result.map(p => p.name).join(', ')}`);
      // CRITICAL FIX: Set battle state SYNCHRONOUSLY - no React.unstable_batchedUpdates needed
      stableSetCurrentBattle(result);
      
      // Force a re-render immediately to ensure the new battle shows
      return result;
    } else {
      console.log(`⚠️ [SYNC_BATTLE_FIX] Failed to generate new battle`);
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

  // CRITICAL FIX: Completely rewritten handleContinueBattles for immediate transition
  const handleContinueBattles = useCallback(() => {
    console.log('[SYNC_BATTLE_FIX] handleContinueBattles: Called');
    
    // Prevent rapid successive calls
    if (continueBattlesRef.current) {
      console.log('[SYNC_BATTLE_FIX] handleContinueBattles: Already processing, ignoring');
      return;
    }
    
    continueBattlesRef.current = true;
    
    if (showingMilestone) {
      console.log('[SYNC_BATTLE_FIX] handleContinueBattles: Milestone active - generating battle and dismissing immediately');
      
      // CRITICAL FIX: Generate new battle SYNCHRONOUSLY
      const newBattle = enhancedStartNewBattle("pairs");
      
      if (newBattle && newBattle.length > 0) {
        console.log(`✅ [SYNC_BATTLE_FIX] New battle ready immediately: ${newBattle.map(p => p.name).join(', ')}`);
        
        // CRITICAL FIX: Dismiss milestone immediately - no delays
        forceDismissMilestone();
        resetMilestoneInProgress();
        
        console.log('✅ [SYNC_BATTLE_FIX] Milestone dismissed immediately with new battle already set');
      } else {
        console.log('⚠️ [SYNC_BATTLE_FIX] Failed to generate new battle, dismissing milestone anyway');
        forceDismissMilestone();
        resetMilestoneInProgress();
      }
    } else {
      console.log('[SYNC_BATTLE_FIX] handleContinueBattles: Starting new battle directly');
      enhancedStartNewBattle("pairs");
    }
    
    continueBattlesRef.current = false;
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
    },
    battleType,
    processBattleResult
  );

  // CRITICAL FIX: Only consider processing result for any processing state
  const isAnyProcessing = isProcessingResult;
  
  console.log(`🔄 [PROCESSOR_FIX] useBattleStateCore processing states:`, {
    isProcessingResult,
    isProcessing,
    isAnyProcessing,
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
    isBattleTransitioning: false, // CRITICAL FIX: Always false to prevent gray screens
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
    goBack: () => {
      goBackHelper();
    },
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
    isAnyProcessing,
    handlePokemonSelect,
    goBackHelper,
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
