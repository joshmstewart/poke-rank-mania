import { useState, useCallback } from 'react';
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';
import { createBattleStarter } from './createBattleStarter';
import { BattleType } from './types';

export const useBattleSelectionState = (
  rankedPokemon: RankedPokemon[],
  allPokemon: Pokemon[],
  setCompletionPercentage: (percentage: number) => void,
  setRankingGenerated: (generated: boolean) => void,
  battleType: BattleType
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [forceSuggestionPriority, setForceSuggestionPriority] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  const { startNewBattle } = createBattleStarter(
    setCurrentBattle,
    rankedPokemon,
    forceSuggestionPriority,
    direction,
    allPokemon,
  );

  const resetSuggestionPriority = useCallback(() => {
    setForceSuggestionPriority(true);
  }, []);

  const disableSuggestionPriority = useCallback(() => {
    setForceSuggestionPriority(false);
  }, []);

  const resetSuggestionState = useCallback(() => {
    setForceSuggestionPriority(false);
  }, []);

  const resetAfterMilestone = useCallback(() => {
    resetSuggestionState();
    setDirection('up');
  }, [resetSuggestionState]);

  const setBattleDirection = useCallback((dir: 'up' | 'down') => {
    setDirection(dir);
  }, []);

  return {
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
    startNewBattle,
    resetSuggestionPriority,
    resetSuggestionState,
  };
};
