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

  // CRITICAL FIX: Filter Pokemon only once and memoize
  const filteredPokemon = useMemo(() => {
    if (!contextPokemon || contextPokemon.length === 0) {
      console.log(`🔍 [COORDINATION_FIX] No context Pokemon available`);
      return [];
    }
    
    const filtered = contextPokemon.filter(pokemon => {
      if (selectedGeneration === 0) {
        return true;
      }
      return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
    });
    
    console.log(`🔍 [COORDINATION_FIX] Filtered Pokemon: ${filtered.length} for generation ${selectedGeneration}`);
    return filtered;
  }, [contextPokemon, selectedGeneration]);

  // CRITICAL FIX: Initialize refs properly
  const initialBattleStartedRef = useRef(false);
  const autoTriggerDisabledRef = useRef(false);
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializationCompleteRef = useRef(false);

  // CRITICAL FIX: Reset initialization when Pokemon data changes
  useEffect(() => {
    if (filteredPokemon.length === 0) {
      console.log(`🔍 [COORDINATION_FIX] No filtered Pokemon - resetting initialization state`);
      initialBattleStartedRef.current = false;
      initializationCompleteRef.current = false;
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    }
  }, [filteredPokemon.length]);

  // SIMPLIFIED: Use only battle starter integration for battle creation functions
  const { 
    battleStarter, 
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings || [],
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    markSuggestionUsed,
    currentBattle,
    initialBattleStartedRef
  );

  const startNewBattleCallbackRef = useRef(startNewBattle);

  // Keep the callback ref updated
  useEffect(() => {
    startNewBattleCallbackRef.current = startNewBattle;
  }, [startNewBattle]);

  // CRITICAL FIX: Only initialize battle starter events when we have stable Pokemon data
  useBattleStarterEvents(
    filteredPokemon, // Pass the filtered Pokemon directly
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
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue,
    allRankedPokemon
  };
};
