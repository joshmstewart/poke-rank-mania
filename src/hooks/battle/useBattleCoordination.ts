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

  const filteredPokemon = useMemo(() => {
    const filtered = (contextPokemon || []).filter(pokemon => {
      if (selectedGeneration === 0) {
        return true;
      }
      return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
    });
    
    console.log(`🔍 [DEBUG_COORDINATION] Filtered Pokemon: ${filtered.length} for generation ${selectedGeneration}`);
    console.log(`🔍 [DEBUG_COORDINATION] allRankedPokemon: ${allRankedPokemon.length} ranked Pokemon available`);
    return filtered;
  }, [contextPokemon, selectedGeneration, allRankedPokemon.length]);

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
    currentBattle
  );

  // CRITICAL FIX: Create refs for battle starter events
  const initialBattleStartedRef = useRef(false);
  const autoTriggerDisabledRef = useRef(false);
  const startNewBattleCallbackRef = useRef(startNewBattle);
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializationCompleteRef = useRef(false);

  // CRITICAL FIX: Update the callback ref immediately when startNewBattle changes
  useEffect(() => {
    console.log(`🔍 [DEBUG_COORDINATION] Updating startNewBattleCallbackRef`);
    console.log(`🔍 [DEBUG_COORDINATION] - Previous callback: ${!!startNewBattleCallbackRef.current}`);
    console.log(`🔍 [DEBUG_COORDINATION] - New callback: ${!!startNewBattle}`);
    
    startNewBattleCallbackRef.current = startNewBattle;
    
    console.log(`🔍 [DEBUG_COORDINATION] - Updated callback: ${!!startNewBattleCallbackRef.current}`);
  }, [startNewBattle]);

  // CRITICAL FIX: Initialize battle starter events to handle auto-battle generation AND pending Pokemon
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

  // CRITICAL FIX: Check for queued refinement battles when battle coordination initializes
  useEffect(() => {
    // Small delay to ensure all components are mounted
    const checkForQueuedBattles = setTimeout(() => {
      if (refinementQueue?.hasRefinementBattles && currentBattle.length === 0) {
        console.log(`🎯 [BATTLE_COORDINATION] Found queued refinement battles on initialization, triggering battle`);
        const result = startNewBattle("pairs");
        console.log(`🎯 [BATTLE_COORDINATION] Battle triggered result:`, result?.map(p => p.name));
      }
    }, 500);

    return () => clearTimeout(checkForQueuedBattles);
  }, [refinementQueue?.hasRefinementBattles, currentBattle.length, startNewBattle]);

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
