import { useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleStateManager } from "./useBattleStateManager";
import { useBattleCoordination } from "./useBattleCoordination";
import { useBattleActionsManager } from "./useBattleActionsManager";

export const useBattleStateCore = (
  allPokemon: Pokemon[] = [],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  const initializationRef = useRef(false);
  const hookInstanceRef = useRef(`core-${Date.now()}`);
  
  if (!initializationRef.current) {
    console.log(`[DEBUG useBattleStateCore] INIT - Instance: ${hookInstanceRef.current} - Using context for Pokemon data`);
    initializationRef.current = true;
  }
  
  const stableInitialBattleType = useMemo(() => initialBattleType, []);
  const stableInitialGeneration = useMemo(() => initialSelectedGeneration, []);
  
  // Use the state manager hook
  const {
    currentBattle,
    setCurrentBattle,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    selectedGeneration,
    setSelectedGeneration,
    battleType,
    setBattleType,
    selectedPokemon,
    setSelectedPokemon,
    isTransitioning,
    setIsTransitioning,
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    needsToReloadSuggestions,
    setNeedsToReloadSuggestions,
    triggerSuggestionPrioritization,
    lastSuggestionLoadTimestampRef,
    debouncedGenerateRankings
  } = useBattleStateManager(stableInitialBattleType, stableInitialGeneration);

  const {
    finalRankings = [],
    confidenceScores,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon
  } = useRankings();

  // Debug logging for type checking
  console.log('[DEBUG useBattleStateCore] Type check - activeTier:', typeof activeTier, activeTier);
  console.log('[DEBUG useBattleStateCore] Type check - currentBattleCount before String():', typeof parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10));

  // Use the coordination hook
  const {
    contextPokemon,
    filteredPokemon,
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones,
    forceDismissMilestone,
    generateRankings,
    handleSaveRankings,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions,
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    milestoneRankings,
    hitMilestones,
    battleStarter,
    startNewBattle,
    resetSuggestionPriority
  } = useBattleCoordination(
    selectedGeneration,
    battleResults,
    finalRankings,
    currentBattle,
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    typeof activeTier === 'string' ? activeTier : String(activeTier), // Line 99 - Ensure string type
    freezePokemonForTier
  );

  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType} - Battle ${String(currentBattleCount)}`);
    
    const result = startNewBattle(battleType);
    
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated, setting immediately: ${result.map(p => p.name).join(', ')}`);
      return result;
    } else {
      console.log(`⚠️ [FLASH_FIX] Failed to generate new battle`);
    }
    
    return result;
  }, [startNewBattle]);

  // Use the actions manager hook
  const {
    processBattleResult,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking,
    goBack,
    handleContinueBattles,
    performFullBattleReset,
    handlePokemonSelect,
    isProcessing
  } = useBattleActionsManager(
    battleHistory,
    setBattleHistory,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleType,
    stableSetCurrentBattle,
    setSelectedPokemon,
    setShowingMilestone,
    setCompletionPercentage,
    setRankingGenerated,
    currentBattle,
    selectedPokemon,
    setCurrentBattle,
    setIsTransitioning,
    filteredPokemon,
    milestones,
    generateRankings,
    typeof activeTier === 'string' ? activeTier : String(activeTier), // Line 151 - Ensure string type, not TopNOption
    freezePokemonForTier,
    battleStarter,
    markSuggestionUsed,
    forceDismissMilestone,
    resetMilestones,
    clearAllSuggestions,
    enhancedStartNewBattle
  );

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
        console.log(`🔢 Found ${String(count)} suggestions in localStorage`);
        lastSuggestionLoadTimestampRef.current = Date.now();
        
        const loadedSuggestions = loadSavedSuggestions();
        console.log(`⭐ useBattleStateCore: Initial load: Loaded ${String(loadedSuggestions.size)} suggestions`);
        
        if (battleResults.length > 0) {
          console.log("⚙️ useBattleStateCore: Triggering initial generateRankings to apply loaded suggestions");
          debouncedGenerateRankings(generateRankings, battleResults);
        }
      } catch (e) {
        console.error("Error parsing saved suggestions:", e);
      }
    }
  }, [loadSavedSuggestions, debouncedGenerateRankings, battleResults.length, generateRankings]);

  const isAnyProcessing = isProcessingResult;
  
  const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  console.log(`🔄 [PROCESSOR_FIX] useBattleStateCore processing states - Battle ${String(currentBattleCount)}:`, {
    isProcessingResult,
    isProcessing,
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
    isBattleTransitioning: isTransitioning,
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
