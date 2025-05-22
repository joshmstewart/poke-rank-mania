import { useEffect } from 'react';
import { Pokemon } from '@/services/pokemon';
import { useLocalStorage } from '../useLocalStorage';
import { RankedPokemon } from './useRankings';
import { createBattleStarter } from './createBattleStarter';
import { BattleType } from './types';

export const useBattleStarterIntegration = (
  setCurrentBattle: (battle: Pokemon[]) => void,
  rankedPokemon: RankedPokemon[],
  allPokemon: Pokemon[],
  battleType: BattleType,
  setCompletionPercentage: (percentage: number) => void,
) => {
  const [forceSuggestionPriority, setForceSuggestionPriority] = useLocalStorage('forceSuggestionPriority', false);
  const [battleDirection, setBattleDirection] = useLocalStorage<'up' | 'down'>('battleDirection', 'down');

  const { startNewBattle } = createBattleStarter(
    setCurrentBattle,
    rankedPokemon,
    forceSuggestionPriority,
    battleDirection,
    allPokemon,
  );

  const resetAfterMilestone = () => {
    setForceSuggestionPriority(true);
    setBattleDirection('down');
  };

  const disableSuggestionPriority = () => {
    setForceSuggestionPriority(false);
  };

  const resetSuggestionPriority = () => {
    setForceSuggestionPriority(true);
  };

  const resetSuggestionState = () => {
    rankedPokemon.forEach((p) => {
      if (p.suggestedAdjustment) {
        p.suggestedAdjustment.used = false;
      }
    });
  };

  useEffect(() => {
    if (forceSuggestionPriority) {
      resetSuggestionState();
    }
  }, [forceSuggestionPriority]);

  useEffect(() => {
    startNewBattle();
    setCompletionPercentage(0);
  }, [battleType, setCompletionPercentage]);

  return {
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority,
    setBattleDirection,
    startNewBattle,
    resetSuggestionPriority,
    resetSuggestionState,
  };
};
