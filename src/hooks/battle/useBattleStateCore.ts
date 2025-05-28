
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateInitialization } from "./useBattleStateInitialization";
import { useBattleStateActions } from "./useBattleStateActions";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateOrchestration } from "./useBattleStateOrchestration";
import { useBattleStateInterface } from "./useBattleStateInterface";

export const useBattleStateCore = (
  allPokemon: Pokemon[] = [],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
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

  // Use orchestration hook for processing state management
  const { isAnyProcessing } = useBattleStateOrchestration(
    stateManagerData,
    providersData,
    actionsData,
    enhancedStartNewBattle
  );

  // Use interface hook to build the final return object
  return useBattleStateInterface(
    stateManagerData,
    providersData,
    actionsData,
    isAnyProcessing,
    enhancedStartNewBattle
  );
};

export const ensureBattleIntegration = (
  battleStarterIntegration: any,
  currentBattle: any[]
) => {
  console.log('[DEBUG] ensureBattleIntegration called with currentBattle.length:', currentBattle?.length || 0);
  return true;
};
