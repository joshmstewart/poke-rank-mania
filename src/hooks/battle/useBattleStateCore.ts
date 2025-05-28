
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateInitialization } from "./useBattleStateInitialization";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateOrchestration } from "./useBattleStateOrchestration";
import { useBattleStateInterface } from "./useBattleStateInterface";
import { useRefinementQueue } from "./useRefinementQueue";

export const useBattleStateCore = (
  allPokemon: Pokemon[] = [],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  // Initialize refinement queue
  const refinementQueue = useRefinementQueue();

  // Initialize all core state and providers
  const {
    stateManagerData,
    providersData,
    enhancedStartNewBattle
  } = useBattleStateInitialization(allPokemon, initialBattleType, initialSelectedGeneration);

  // Create generateRankings wrapper that returns array
  const generateRankingsWrapper = useCallback((results: any[]) => {
    const rankings = providersData.generateRankings(results);
    // If generateRankings returns void, return empty array or finalRankings
    return rankings || providersData.finalRankings || [];
  }, [providersData.generateRankings, providersData.finalRankings]);

  // Enhanced start new battle with refinement queue integration
  const enhancedStartNewBattleWithRefinement = useCallback((battleType: BattleType) => {
    console.log(`🔄 [REFINEMENT_INTEGRATION] Starting new battle, checking refinement queue first`);
    
    // Check for refinement battles first
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_INTEGRATION] Prioritizing refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        console.log(`⚔️ [REFINEMENT_INTEGRATION] Successfully created refinement battle: ${primary.name} vs ${opponent.name}`);
        return refinementBattle;
      } else {
        console.warn(`⚔️ [REFINEMENT_INTEGRATION] Could not find Pokemon for refinement battle:`, nextRefinement);
        // Pop the invalid battle and try regular battle generation
        refinementQueue.popRefinementBattle();
      }
    }
    
    // No refinement battles or invalid battle, proceed with normal generation
    return enhancedStartNewBattle(battleType);
  }, [allPokemon, refinementQueue, enhancedStartNewBattle]);

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
    enhancedStartNewBattleWithRefinement // Use enhanced version with refinement integration
  );

  // Handle manual reordering
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [MANUAL_REORDER] Handling reorder for Pokemon ${draggedPokemonId}: ${sourceIndex} → ${destinationIndex}`);
    
    // Calculate neighbor Pokemon IDs for validation battles
    const neighbors: number[] = [];
    const rankings = providersData.finalRankings || [];
    
    // Add Pokemon above and below the new position
    if (destinationIndex > 0 && rankings[destinationIndex - 1]) {
      neighbors.push(rankings[destinationIndex - 1].id);
    }
    if (destinationIndex < rankings.length - 1 && rankings[destinationIndex + 1]) {
      neighbors.push(rankings[destinationIndex + 1].id);
    }
    
    // Queue refinement battles
    refinementQueue.queueBattlesForReorder(draggedPokemonId, neighbors, destinationIndex + 1);
    
    console.log(`🔄 [MANUAL_REORDER] Queued ${neighbors.length} validation battles for Pokemon ${draggedPokemonId}`);
  }, [providersData.finalRankings, refinementQueue]);

  // Handle battle completion to pop refinement battles
  const originalProcessBattleResult = actionsData.processBattleResult;
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    // Call original battle processing with proper parameters
    const result = originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
    
    // Pop completed refinement battle if any
    if (refinementQueue.hasRefinementBattles) {
      console.log(`⚔️ [REFINEMENT_INTEGRATION] Battle completed, popping refinement battle from queue`);
      refinementQueue.popRefinementBattle();
    }
    
    return result;
  }, [originalProcessBattleResult, refinementQueue]);

  // Use the effects hook
  useBattleStateEffects(
    providersData.loadSavedSuggestions,
    stateManagerData.debouncedGenerateRankings,
    stateManagerData.battleResults,
    providersData.generateRankings,
    stateManagerData.lastSuggestionLoadTimestampRef
  );

  // Use orchestration hook for processing state management
  const { isAnyProcessing } = useBattleStateOrchestration(
    stateManagerData,
    providersData,
    { ...actionsData, processBattleResult: processBattleResultWithRefinement },
    enhancedStartNewBattleWithRefinement
  );

  // Use interface hook to build the final return object
  const interfaceData = useBattleStateInterface(
    stateManagerData,
    providersData,
    { ...actionsData, processBattleResult: processBattleResultWithRefinement },
    isAnyProcessing,
    enhancedStartNewBattleWithRefinement
  );

  return {
    ...interfaceData,
    // Add refinement-specific functionality
    handleManualReorder,
    pendingRefinements: new Set(refinementQueue.refinementQueue.map(b => b.primaryPokemonId)),
    refinementBattleCount: refinementQueue.refinementBattleCount,
    clearRefinementQueue: refinementQueue.clearRefinementQueue
  };
};

export const ensureBattleIntegration = (
  battleStarterIntegration: any,
  currentBattle: any[]
) => {
  console.log('[DEBUG] ensureBattleIntegration called with currentBattle.length:', currentBattle?.length || 0);
  return true;
};
