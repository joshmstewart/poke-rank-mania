
import { useEffect, useMemo } from "react";
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
    allRankedPokemon // CRITICAL FIX: Get ranked Pokemon from useRankings
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
    
    console.log(`[DEBUG useBattleCoordination] Filtered Pokemon: ${filtered.length} for generation ${selectedGeneration}`);
    console.log(`[DEBUG useBattleCoordination] allRankedPokemon: ${allRankedPokemon.length} ranked Pokemon available`);
    return filtered;
  }, [contextPokemon, selectedGeneration, allRankedPokemon.length]);

  const { 
    battleStarter, 
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue // CRITICAL FIX: Extract refinement queue from integration
  } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings || [],
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    markSuggestionUsed,
    currentBattle
  );

  // CRITICAL: Initialize battle starter events to handle auto-battle generation
  useBattleStarterEvents(
    filteredPokemon,
    currentBattle,
    // Initialize refs for battle starter events
    { current: false }, // initialBattleStartedRef
    { current: false }, // autoTriggerDisabledRef
    { current: startNewBattle }, // startNewBattleCallbackRef
    { current: null }, // initializationTimerRef
    { current: false }, // initializationCompleteRef
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
    refinementQueue, // CRITICAL FIX: Include refinement queue in return object
    allRankedPokemon // CRITICAL FIX: Include ranked Pokemon in return object
  };
};
