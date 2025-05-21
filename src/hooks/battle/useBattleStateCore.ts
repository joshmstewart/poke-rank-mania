import { useState, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useBattleStarterIntegration } from "@/hooks/battle/useBattleStarterIntegration";
import { useBattleProcessor } from "@/hooks/battle/useBattleProcessor";
import { useProgressState } from "@/hooks/battle/useProgressState";
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleInteractions } from "./useBattleInteractions"; 

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const initialBattleTypeStored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || initialBattleType;
  const [battleType, setBattleType] = useState<BattleType>(initialBattleTypeStored);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);

  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones
  } = useProgressState();

  const {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion
  } = useRankings(allPokemon);

  const {
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  } = useCompletionTracker(
    battleResults,
    setRankingGenerated,
    setCompletionPercentage,
    showingMilestone,
    setShowingMilestone,
    generateRankings,
    allPokemon
  );

  // Filter Pokemon by generation if a specific generation is selected
  const filteredPokemon = allPokemon.filter(pokemon => {
    // We need to check if the pokemon has a generation property and use it
    if (selectedGeneration === 0) {
      return true;
    }
    return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
  });

  const { battleStarter, startNewBattle } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings, 
    setCurrentBattle,
    setSelectedPokemon
  );

  const { 
    processBattleResult,
    isProcessingResult, 
    resetMilestoneInProgress 
  } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    filteredPokemon,
    setCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon,
    activeTier,
    freezePokemonForTier,
    battleStarter,
    markSuggestionUsed
  );

  // REMOVED: Comment out the effect that clears suggestions
  // We'll keep this commented for reference
  /*
  useEffect(() => {
    // This will run when the component mounts
    clearAllSuggestions();
    
    // Return cleanup function that runs when component unmounts
    return () => {
      // Clear suggestions when leaving battle screen
      clearAllSuggestions();
    };
  }, [clearAllSuggestions]);
  */

  const {
    handlePokemonSelect,
    handleGoBack: goBackHelper,
    isProcessing
  } = useBattleInteractions(
    currentBattle,
    setCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
      }
    },
    () => {
      console.log("Going back in battle navigation");
      // Any additional back logic here
    },
    battleType,
    processBattleResult
  );

  return {
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
    handlePokemonSelect,
    handleTripletSelectionComplete: () => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
      }
    },
    handleSelection: (id: number) => {
      handlePokemonSelect(id);
    },
    goBack: () => {
      goBackHelper();
    },
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    handleSaveRankings,
    processorRefs: { resetMilestoneInProgress },
    freezePokemonForTier,
    isPokemonFrozenForTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions
  };
};
