import { useState, useEffect } from 'react';
import { useRankings, RankedPokemon } from './useRankings';
import { useBattleSelectionState } from './useBattleSelectionState';
import { Pokemon } from '@/services/pokemon';
import { SingleBattle } from './types';

export const useBattleStateCore = (allPokemon: Pokemon[]) => {
  const {
    finalRankings,
    confidenceScores,
    generateRankings,
    suggestRanking,
    clearAllSuggestions,
    markSuggestionUsed,
  } = useRankings(allPokemon);

  const {
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
  } = useBattleSelectionState(finalRankings, allPokemon);

  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [frozenPokemon, setFrozenPokemon] = useState<Set<number>>(new Set());

  const handleSaveRankings = () => {
    // Implement saving logic here if you have persistence
  };

  const freezePokemonForTier = (pokemonId: number) => {
    setFrozenPokemon(prev => new Set(prev).add(pokemonId));
  };

  const isPokemonFrozenForTier = (pokemonId: number) => frozenPokemon.has(pokemonId);

  const removeSuggestion = (pokemonId: number) => {
    markSuggestionUsed(pokemonId);
  };

  const findNextSuggestion = () => {
    return finalRankings.find(p => p.suggestedAdjustment && !p.suggestedAdjustment.used);
  };

  const loadSavedSuggestions = (suggestions: any[]) => {
    suggestions.forEach(({pokemonId, direction, strength}) => {
      const pokemon = finalRankings.find(p => p.id === pokemonId);
      if (pokemon) suggestRanking(pokemon, direction, strength);
    });
  };

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    suggestRanking,
    clearAllSuggestions,
    markSuggestionUsed,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    removeSuggestion,
    findNextSuggestion,
    loadSavedSuggestions,
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
  };
};
