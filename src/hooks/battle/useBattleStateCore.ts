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

  const stableSetCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🔄 [FLASH_FIX] stableSetCurrentBattle called with ${battle.length} Pokemon`);
    setCurrentBattle(battle);
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

  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType}`);
    
    const result = startNewBattle(battleType);
    
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated, setting immediately: ${result.map(p => p.name).join(', ')}`);
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

  const goBack = useCallback(() => {
    console.log(`🔄 [BACK_FIX] goBack called`);
    
    if (battleHistory.length === 0) {
      toast({
        title: "No previous battles",
        description: "There are no previous battles to return to."
      });
      return;
    }

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);

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
      stableSetCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setShowingMilestone(false);
  }, [battleHistory, battleResults, battleType, setBattleHistory, setBattleResults, setBattlesCompleted, setSelectedPokemon, setShowingMilestone, stableSetCurrentBattle]);

  const handleContinueBattles = useCallback(() => {
    console.log('[FLASH_FIX] handleContinueBattles: Called');
    
    if (continueBattlesRef.current) {
      console.log('[FLASH_FIX] handleContinueBattles: Already processing, ignoring');
      return;
    }
    
    continueBattlesRef.current = true;
    
    if (showingMilestone) {
      console.log('[FLASH_FIX] handleContinueBattles: Dismissing milestone and starting new battle');
      
      setCurrentBattle([]);
      setSelectedPokemon([]);
      
      forceDismissMilestone();
      resetMilestoneInProgress();
      
      setTimeout(() => {
        enhancedStartNewBattle("pairs");
        continueBattlesRef.current = false;
      }, 100);
    } else {
      console.log('[FLASH_FIX] handleContinueBattles: Starting new battle directly');
      enhancedStartNewBattle("pairs");
      continueBattlesRef.current = false;
    }
  }, [showingMilestone, forceDismissMilestone, enhancedStartNewBattle, resetMilestoneInProgress, setCurrentBattle, setSelectedPokemon]);

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
      goBack();
    },
    battleType,
    processBattleResult
  );

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
    isBattleTransitioning: false, // Simplified - no complex transition logic
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
