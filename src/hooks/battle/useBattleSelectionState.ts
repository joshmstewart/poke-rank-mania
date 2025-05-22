import { useState, useEffect } from 'react';
import { Pokemon } from '@/services/pokemon';
import { createBattleStarter } from './createBattleStarter';
import { RankedPokemon } from './useRankings';

interface BattleSelectionState {
  currentBattle: Pokemon[];
  startNewBattle: () => Pokemon[];
  resetSuggestions: () => void;
}

export const useBattleSelectionState = (
  rankedPokemon: RankedPokemon[],
  forceSuggestionPriority: boolean,
  direction: 'up' | 'down',
  allPokemon: Pokemon[],
): BattleSelectionState => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);

  const { startNewBattle, resetSuggestionState } = createBattleStarter(
    setCurrentBattle,
    rankedPokemon,
    forceSuggestionPriority,
    direction,
    allPokemon,
  );

  useEffect(() => {
    startNewBattle();
  }, [rankedPokemon, forceSuggestionPriority, direction]);

  return { currentBattle, startNewBattle, resetSuggestions: resetSuggestionState };
};
