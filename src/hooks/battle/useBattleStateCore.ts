import { useState, useEffect } from 'react';
import { useRankings } from './useRankings';
import { useBattleSelectionState } from './useBattleSelectionState';
import { Pokemon } from '@/services/pokemon';

export const useBattleStateCore = () => {
  const allPokemon: Pokemon[] = []; // ensure you populate this from your context or prop
  const rankingsHook = useRankings(allPokemon);

  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<number | string>('all');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [battleType, setBattleType] = useState<'pair' | 'triplet'>('pair');
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);

  const selectionState = useBattleSelectionState(
    rankingsHook.finalRankings,
    allPokemon,
    setCompletionPercentage,
    setRankingGenerated,
    battleType
  );

  // Other logic and effects...

  return {
    ...rankingsHook,
    ...selectionState,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    setSelectedPokemon,
    battleType,
    setBattleType,
    battleHistory,
    setBattleHistory,
    milestones,
    isProcessingResult,
    setIsProcessingResult,
    handleSelection: setSelectedPokemon,
    handleTripletSelectionComplete: setSelectedPokemon,
    goBack: () => setSelectedPokemon([]),
    handleContinueBattles: selectionState.startNewBattle,
    resetMilestoneInProgress: () => setShowingMilestone(false),
    getSnapshotForMilestone: () => ({ rankings: rankingsHook.finalRankings, battles: battleHistory }),
  };
};
