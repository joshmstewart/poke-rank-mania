
import { useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateManager } from "./useBattleStateManager";
import { useBattleStateProviders } from "./useBattleStateProviders";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateEffects } from "./useBattleStateEffects";

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
  const stateManagerData = useBattleStateManager(stableInitialBattleType, stableInitialGeneration);

  // Use the providers hook
  const providersData = useBattleStateProviders(
    stateManagerData.selectedGeneration,
    stateManagerData.battleResults,
    stateManagerData.currentBattle,
    stateManagerData.stableSetCurrentBattle,
    stateManagerData.stableSetSelectedPokemon,
    typeof stateManagerData.activeTier === 'string' ? stateManagerData.activeTier : String(stateManagerData.activeTier)
  );

  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType} - Battle ${String(currentBattleCount)}`);
    
    const result = providersData.startNewBattle(battleType);
    
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated, setting immediately: ${result.map(p => p.name).join(', ')}`);
      return result;
    } else {
      console.log(`⚠️ [FLASH_FIX] Failed to generate new battle`);
    }
    
    return result;
  }, [providersData.startNewBattle]);

  // Create generateRankings wrapper that returns array
  const generateRankingsWrapper = useCallback((results: any[]) => {
    const rankings = providersData.generateRankings(results);
    // If generateRankings returns void, return empty array or finalRankings
    return rankings || providersData.finalRankings || [];
  }, [providersData.generateRankings, providersData.finalRankings]);

  // Use the actions hook
  const actionsData = useBattleStateActions(
    stateManagerData.battleHistory,
    stateManagerData.setBattleHistory,
    stateManagerData.battleResults,
    stateManagerData.setBattleResults,
    stateManagerData.battlesCompleted,
    stateManagerData.setBattlesCompleted,
    stateManagerData.battleType,
    stateManagerData.stableSetCurrentBattle,
    stateManagerData.setSelectedPokemon,
    providersData.setShowingMilestone,
    providersData.setCompletionPercentage,
    providersData.setRankingGenerated,
    stateManagerData.currentBattle,
    stateManagerData.selectedPokemon,
    stateManagerData.setCurrentBattle,
    stateManagerData.setIsTransitioning,
    providersData.filteredPokemon,
    providersData.milestones,
    generateRankingsWrapper,
    typeof stateManagerData.activeTier === 'string' ? stateManagerData.activeTier : String(stateManagerData.activeTier),
    providersData.freezePokemonForTierStringWrapper,
    providersData.battleStarter,
    providersData.markSuggestionUsed,
    providersData.forceDismissMilestone,
    providersData.resetMilestones,
    providersData.clearAllSuggestions,
    enhancedStartNewBattle
  );

  // Use the effects hook
  useBattleStateEffects(
    providersData.loadSavedSuggestions,
    stateManagerData.debouncedGenerateRankings,
    stateManagerData.battleResults,
    providersData.generateRankings,
    stateManagerData.lastSuggestionLoadTimestampRef
  );

  const isAnyProcessing = actionsData.isProcessingResult;
  
  const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  console.log(`🔄 [PROCESSOR_FIX] useBattleStateCore processing states - Battle ${String(currentBattleCount)}:`, {
    isProcessingResult: actionsData.isProcessingResult,
    isProcessing: actionsData.isProcessing,
    isAnyProcessing,
    isTransitioning: stateManagerData.isTransitioning,
    timestamp: new Date().toISOString()
  });

  return useMemo(() => ({
    currentBattle: stateManagerData.currentBattle,
    battleResults: stateManagerData.battleResults,
    battlesCompleted: stateManagerData.battlesCompleted,
    showingMilestone: providersData.showingMilestone,
    setShowingMilestone: providersData.setShowingMilestone,
    selectedGeneration: stateManagerData.selectedGeneration,
    setSelectedGeneration: stateManagerData.setSelectedGeneration,
    completionPercentage: providersData.completionPercentage,
    rankingGenerated: providersData.rankingGenerated,
    selectedPokemon: stateManagerData.selectedPokemon,
    battleType: stateManagerData.battleType,
    setBattleType: stateManagerData.setBattleType,
    finalRankings: providersData.finalRankings,
    confidenceScores: providersData.confidenceScores,
    battleHistory: stateManagerData.battleHistory,
    activeTier: stateManagerData.activeTier,
    setActiveTier: stateManagerData.setActiveTier,
    isBattleTransitioning: stateManagerData.isTransitioning,
    isAnyProcessing,
    handlePokemonSelect: (id: number) => {
      actionsData.handlePokemonSelect(id);
    },
    handleTripletSelectionComplete: () => {
      if (stateManagerData.battleType === "triplets") {
        actionsData.processBattleResult(stateManagerData.selectedPokemon, stateManagerData.currentBattle, stateManagerData.battleType, stateManagerData.selectedGeneration);
      }
    },
    handleSelection: (id: number) => {
      actionsData.handlePokemonSelect(id);
    },
    goBack: actionsData.goBack,
    isProcessingResult: actionsData.isProcessingResult,
    startNewBattle: enhancedStartNewBattle,
    milestones: providersData.milestones,
    resetMilestones: providersData.resetMilestones,
    calculateCompletionPercentage: providersData.calculateCompletionPercentage,
    getSnapshotForMilestone: providersData.getSnapshotForMilestone,
    generateRankings: providersData.generateRankings,
    handleSaveRankings: providersData.handleSaveRankings,
    freezePokemonForTier: providersData.freezePokemonForTier,
    isPokemonFrozenForTier: providersData.isPokemonFrozenForTier,
    suggestRanking: providersData.suggestRanking,
    removeSuggestion: providersData.removeSuggestion,
    clearAllSuggestions: providersData.clearAllSuggestions,
    handleContinueBattles: actionsData.handleContinueBattles,
    resetMilestoneInProgress: actionsData.resetMilestoneInProgress,
    performFullBattleReset: actionsData.performFullBattleReset
  }), [
    stateManagerData,
    providersData,
    actionsData,
    isAnyProcessing,
    enhancedStartNewBattle
  ]);
};

export const ensureBattleIntegration = (
  battleStarterIntegration: any,
  currentBattle: any[]
) => {
  console.log('[DEBUG] ensureBattleIntegration called with currentBattle.length:', currentBattle?.length || 0);
  return true;
};
