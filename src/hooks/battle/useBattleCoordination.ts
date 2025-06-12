import { useEffect, useMemo, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useProgressState } from "./useProgressState";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleStarterEvents } from "./useBattleStarterEvents";

export const useBattleCoordination = (
  selectedGeneration: number,
  battleResults: any[],
  finalRankings: any[],
  currentBattle: Pokemon[],
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  stableSetSelectedPokemon: (pokemon: number[]) => void,
  activeTier: string,
  freezePokemonForTier: (pokemonId: number, tier: string) => void
) => {
  const { allPokemon: contextPokemon } = usePokemonContext();
  
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
    generateRankings,
    handleSaveRankings,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions,
    allRankedPokemon
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

  // SIMPLIFIED: Filter Pokemon only once and memoize
  const filteredPokemon = useMemo(() => {
    if (!contextPokemon || contextPokemon.length === 0) {
      console.log(`🔍 [COORDINATION_SIMPLIFIED] No context Pokemon available`);
      return [];
    }
    
    const filtered = contextPokemon.filter(pokemon => {
      if (selectedGeneration === 0) {
        return true;
      }
      return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
    });
    
    console.log(`🔍 [COORDINATION_SIMPLIFIED] Filtered Pokemon: ${filtered.length} for generation ${selectedGeneration}`);
    return filtered;
  }, [contextPokemon, selectedGeneration]);

  // SIMPLIFIED: Initialize refs properly
  const initialBattleStartedRef = useRef(false);
  const autoTriggerDisabledRef = useRef(false);
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializationCompleteRef = useRef(false);

  // SIMPLIFIED: Reset initialization when Pokemon data changes
  useEffect(() => {
    if (filteredPokemon.length === 0) {
      console.log(`🔍 [COORDINATION_SIMPLIFIED] No filtered Pokemon - resetting initialization state`);
      initialBattleStartedRef.current = false;
      initializationCompleteRef.current = false;
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    }
  }, [filteredPokemon.length]);

  // SIMPLIFIED: Create wrapper function for markSuggestionUsed
  const markSuggestionUsedWrapper = (pokemonId: number) => {
    const pokemon = allRankedPokemon.find(p => p.id === pokemonId);
    if (pokemon) {
      markSuggestionUsed(pokemon, true);
    }
  };

  // SIMPLIFIED: Use battle starter integration
  const { 
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings || [],
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    markSuggestionUsedWrapper,
    currentBattle,
    initialBattleStartedRef
  );

  const startNewBattleCallbackRef = useRef(startNewBattle);

  // Keep the callback ref updated
  useEffect(() => {
    startNewBattleCallbackRef.current = startNewBattle;
  }, [startNewBattle]);

  // SIMPLIFIED: Only use battle starter events when we have stable Pokemon data
  useBattleStarterEvents(
    filteredPokemon,
    currentBattle,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    startNewBattleCallbackRef,
    initializationTimerRef,
    initializationCompleteRef,
    stableSetCurrentBattle,
    stableSetSelectedPokemon
  );

  return {
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
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue,
    allRankedPokemon
  };
};
