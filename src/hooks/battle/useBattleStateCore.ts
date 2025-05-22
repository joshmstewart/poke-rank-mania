import { useState, useEffect } from 'react';
import { useRankings, RankedPokemon } from './useRankings';
import { useBattleSelectionState } from './useBattleSelectionState';
import { Pokemon } from '@/services/pokemon';
import { SingleBattle, BattleType } from './types';

export const useBattleStateCore = (allPokemon: Pokemon[]) => {
  const {
    finalRankings,
    confidenceScores,
    generateRankings,
    suggestRanking,
    clearAllSuggestions,
    markSuggestionUsed,
  } = useRankings(allPokemon);

  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<number | string>("all");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>('pair');
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  const {
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    resetSuggestionState,
  } = useBattleSelectionState(finalRankings, allPokemon, setCompletionPercentage, setRankingGenerated, battleType);

  const handlePokemonSelect = (pokemonId: number) => {
    setSelectedPokemon([pokemonId]);
  };

  const handleTripletSelectionComplete = (selectedIds: number[]) => {
    setSelectedPokemon(selectedIds);
  };

  const handleSelection = (selectedIds: number[]) => {
    setSelectedPokemon(selectedIds);
  };

  const goBack = () => {
    setSelectedPokemon([]);
  };

  const resetMilestones = () => {
    setMilestones([]);
  };

  const calculateCompletionPercentage = () => {
    const percentage = (battlesCompleted / allPokemon.length) * 100;
    setCompletionPercentage(percentage);
  };

  const getSnapshotForMilestone = () => {
    return { rankings: finalRankings, battles: battleHistory };
  };

  const handleContinueBattles = () => {
    setShowingMilestone(false);
    resetSuggestionPriority();
    resetSuggestionState();
    startNewBattle();
  };

  const resetMilestoneInProgress = () => {
    setShowingMilestone(false);
  };

  const handleSaveRankings = () => {
    // Add your save logic if applicable
  };

  const freezePokemonForTier = (pokemonId: number) => {
    // Implement tier freezing logic
  };

  const isPokemonFrozenForTier = (pokemonId: number) => {
    // Return freeze status if tier freezing logic is implemented
    return false;
  };

  const removeSuggestion = (pokemonId: number) => {
    markSuggestionUsed(pokemonId);
  };

  const findNextSuggestion = () => {
    return finalRankings.find((p) => p.suggestedAdjustment && !p.suggestedAdjustment.used);
  };

  const loadSavedSuggestions = (suggestions: any[]) => {
    suggestions.forEach(({ pokemonId, direction, strength }) => {
      const pokemon = finalRankings.find((p) => p.id === pokemonId);
      if (pokemon) suggestRanking(pokemon, direction, strength);
    });
  };

  // Example simplified milestone logic:
  useEffect(() => {
    if (battlesCompleted > 0 && battlesCompleted % 50 === 0) {
      setShowingMilestone(true);
      setMilestones((prev) => [...prev, getSnapshotForMilestone()]);
    }
  }, [battlesCompleted]);

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    suggestRanking,
    clearAllSuggestions,
    markSuggestionUsed,
    handleSaveRankings,
    activeTier: null,
    setActiveTier: () => {},
    freezePokemonForTier,
    isPokemonFrozenForTier,
    removeSuggestion,
    findNextSuggestion,
    loadSavedSuggestions,
    battlesCompleted,
    setBattlesCompleted,
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
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    handleContinueBattles,
    resetMilestoneInProgress,
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    resetSuggestionState,
  };
};
