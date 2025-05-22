
import { useState } from 'react';
import { createBattleStarter } from './createBattleStarter';
import { BattleType } from './types';
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';

export const useBattleSelectionState = (
  rankedPokemon: RankedPokemon[],
  allPokemon: Pokemon[],
  setCompletionPercentage: (percentage: number) => void,
  setRankingGenerated: (generated: boolean) => void,
  initialBattleType: BattleType
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [forceSuggestionPriority, setForceSuggestionPriority] = useState(false);
  const [battleDirection, setBattleDirection] = useState<'up' | 'down'>('down');

  const battleStarter = createBattleStarter(
    setCurrentBattle,
    rankedPokemon,
    forceSuggestionPriority,
    battleDirection,
    allPokemon
  );

  const startNewBattle = (
    selectedGeneration: number | string = "all"
  ) => {
    battleStarter.startNewBattle();
  };

  const resetSuggestionPriority = () => {
    setForceSuggestionPriority(false);
  };

  const resetAfterMilestone = () => {
    setForceSuggestionPriority(true);
  };

  const resetSuggestionState = () => {
    // Since resetStateAfterMilestone doesn't exist, we'll handle it here
    setForceSuggestionPriority(true);
  };

  return {
    currentBattle,
    forceSuggestionPriority,
    resetAfterMilestone,
    disableSuggestionPriority: () => setForceSuggestionPriority(false),
    setBattleDirection,
    startNewBattle,
    resetSuggestionPriority,
    resetSuggestionState,
  };
};
