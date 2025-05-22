import { useEffect, useState, useCallback } from 'react';
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';
import { useBattleSelectionState } from './useBattleSelectionState';

export const useBattleStarterIntegration = (
  rankedPokemon: RankedPokemon[],
  allPokemon: Pokemon[],
) => {
  const [forceSuggestionPriority, setForceSuggestionPriority] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('down');

  const {
    currentBattle,
    startNewBattle,
    resetSuggestions,
  } = useBattleSelectionState(
    rankedPokemon,
    forceSuggestionPriority,
    direction,
    allPokemon,
  );

  const resetAfterMilestone = useCallback(() => {
    setForceSuggestionPriority(true);
    resetSuggestions();
    startNewBattle();
  }, [resetSuggestions, startNewBattle]);

  useEffect(() => {
    if (forceSuggestionPriority) {
      startNewBattle();
    }
  }, [forceSuggestionPriority, rankedPokemon, direction]);

  const disableSuggestionPriority = () => setForceSuggestionPriority(false);
  const setBattleDirection = (dir: 'up' | 'down') => setDirection(dir);

  return {
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
  };
};
