import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateInitialization } from "./useBattleStateInitialization";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateOrchestration } from "./useBattleStateOrchestration";
import { useBattleStateInterface } from "./useBattleStateInterface";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateCore = (
  allPokemon: Pokemon[] = [],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  // Use shared refinement queue instead of creating a new instance
  const refinementQueue = useSharedRefinementQueue();

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
    console.log(`🔄 [REFINEMENT_INTEGRATION] Refinement queue has ${refinementQueue.refinementBattleCount} battles`);
    
    // Check for refinement battles first - this is the key integration point
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_INTEGRATION] Found pending refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_INTEGRATION] Reason: ${nextRefinement.reason}`);
      
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
    console.log(`🎮 [REFINEMENT_INTEGRATION] No valid refinement battles, proceeding with regular generation`);
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
    
    // Also add a few more nearby Pokemon for more thorough validation
    if (destinationIndex > 1 && rankings[destinationIndex - 2]) {
      neighbors.push(rankings[destinationIndex - 2].id);
    }
    if (destinationIndex < rankings.length - 2 && rankings[destinationIndex + 2]) {
      neighbors.push(rankings[destinationIndex + 2].id);
    }
    
    // Queue refinement battles - this is where the drag action creates future battles
    refinementQueue.queueBattlesForReorder(draggedPokemonId, neighbors, destinationIndex + 1);
    
    console.log(`🔄 [MANUAL_REORDER] Queued validation battles with neighbors: ${neighbors.join(', ')}`);
    console.log(`🔄 [MANUAL_REORDER] Next battle will prioritize these validation battles`);
  }, [providersData.finalRankings, refinementQueue]);

  // CRITICAL FIX: Handle battle completion to pop refinement battles from queue
  const originalProcessBattleResult = actionsData.processBattleResult;
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [REFINEMENT_COMPLETION] Processing battle result...`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Current battle Pokemon IDs: ${currentBattlePokemon.map(p => p.id).join(', ')}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Refinement queue count: ${refinementQueue.refinementBattleCount}`);
    
    // Check if this was a refinement battle before processing
    if (refinementQueue.hasRefinementBattles && currentBattlePokemon.length === 2) {
      const currentRefinement = refinementQueue.getNextRefinementBattle();
      
      if (currentRefinement) {
        const battlePokemonIds = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b);
        const refinementIds = [currentRefinement.primaryPokemonId, currentRefinement.opponentPokemonId].sort((a, b) => a - b);
        
        console.log(`⚔️ [REFINEMENT_COMPLETION] Comparing battle IDs [${battlePokemonIds.join(', ')}] with refinement IDs [${refinementIds.join(', ')}]`);
        
        // Check if this battle matches the current refinement battle
        if (battlePokemonIds[0] === refinementIds[0] && battlePokemonIds[1] === refinementIds[1]) {
          console.log(`⚔️ [REFINEMENT_COMPLETION] ✅ This was a refinement battle! Popping from queue`);
          console.log(`⚔️ [REFINEMENT_COMPLETION] Reason: ${currentRefinement.reason}`);
          refinementQueue.popRefinementBattle();
          console.log(`⚔️ [REFINEMENT_COMPLETION] Remaining refinement battles: ${refinementQueue.refinementBattleCount - 1}`);
        } else {
          console.log(`⚔️ [REFINEMENT_COMPLETION] ❌ Battle IDs don't match, not a refinement battle`);
        }
      } else {
        console.log(`⚔️ [REFINEMENT_COMPLETION] ❌ No current refinement battle found`);
      }
    } else {
      console.log(`⚔️ [REFINEMENT_COMPLETION] ❌ Not a refinement battle (hasRefinements: ${refinementQueue.hasRefinementBattles}, battleLength: ${currentBattlePokemon.length})`);
    }
    
    // Call original battle processing
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
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
