import { useState, useCallback } from 'react';
import { createBattleStarter } from './createBattleStarter';
import { RankedPokemon } from './useRankings';
import { Pokemon } from '@/services/pokemon';
import { BattleType } from './types';

export const useBattleSelectionState = (
  finalRankings: RankedPokemon[],
  allPokemon: Pokemon[],
  setCompletionPercentage: (percent: number) => void,
  setRankingGenerated: (generated: boolean) => void,
  battleType: BattleType,
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [forceSuggestionPriority, setForceSuggestionPriority] = useState(false);
  const [battleDirection, setBattleDirection] = useState<'up' | 'down'>('up');

  const {
    startNewBattle,
    resetAfterMilestone,
    resetSuggestionPriority,
    resetSuggestionState,
  } = createBattleStarter(
    finalRankings,
    allPokemon,
    setCurrentBattle,
    battleType,
    battleDirection,
    forceSuggestionPriority,
    setCompletionPercentage,
    setRankingGenerated,
  );

  const disableSuggestionPriority = useCallback(() => {
    setForceSuggestionPriority(false);
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
