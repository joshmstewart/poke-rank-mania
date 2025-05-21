import { useState, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useBattleStarterIntegration } from "@/hooks/battle/useBattleStarterIntegration";
import { useBattleProcessor } from "@/hooks/battle/useBattleProcessor";
import { useProgressState } from "@/hooks/battle/useProgressState";
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";
import { useBattleInteractions } from "@/hooks/battle/useBattleInteractions";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";

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
    allRankedPokemon
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

  const filteredPokemon = allPokemon.filter(pokemon => {
    if (selectedGeneration === 0) {
      return true;
    }
    return pokemon.generation === selectedGeneration;
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
    battleStarter // Pass the battleStarter to have access to trackLowerTierLoss
  );

  const handleGoBack = useCallback((
    setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
    battleType: BattleType
  ) => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon(lastBattle.selected);
      setBattleHistory(prev => prev.slice(0, -1));
    } else {
      startNewBattle(battleType);
    }
  }, [battleHistory, setSelectedPokemon, startNewBattle]);

  const {
    selectedPokemon,
    setSelectedPokemon,
    handlePokemonSelect
  } = useBattleInteractions(
    currentBattle,
    setCurrentBattle,
    [],
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "triplets") {
        processBattleResult([], currentBattle, battleType, selectedGeneration);
      }
    },
    handleGoBack,
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
      handleGoBack(setCurrentBattle, battleType);
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
    battleHistory: battleHistory,
    freezePokemonForTier,
    isPokemonFrozenForTier
  };
};
