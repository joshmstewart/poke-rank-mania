import { useState } from 'react';
import { createBattleStarter } from './createBattleStarter';
import { RankedPokemon, BattleType } from './types';
import { Pokemon } from '@/services/pokemon';

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
    allPokemon,
    battleType,
    forceSuggestionPriority,
    setForceSuggestionPriority,
    battleDirection,
    setBattleDirection
  );

  const startNewBattle = (
    selectedGeneration: number | string = "all",
    selectedBattleType: BattleType = battleType
  ) => {
    setBattleType(selectedBattleType);
    battleStarter.startNewBattle(selectedGeneration, selectedBattleType);
  };

  const resetSuggestionPriority = () => {
    setForceSuggestionPriority(false);
  };

  const resetAfterMilestone = () => {
    setForceSuggestionPriority(true);
  };

  const resetSuggestionState = () => {
    battleStarter.resetStateAfterMilestone();
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
