
import { useEffect, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useProgressState } from "./useProgressState";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleProcessor } from "./useBattleProcessor";

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
    
    console.log(`[DEBUG useBattleCoordination] Filtered Pokemon: ${filtered.length} for generation ${selectedGeneration}`);
    return filtered;
  }, [contextPokemon, selectedGeneration]);

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
    resetSuggestionPriority
  };
};
