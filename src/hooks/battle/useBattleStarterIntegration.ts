import { useEffect } from 'react';
import { createBattleStarter } from './createBattleStarter';
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';

export const useBattleStarterIntegration = (
  setCurrentBattle: (battle: Pokemon[]) => void,
  rankedPokemon: RankedPokemon[],
  forceSuggestionPriority: boolean,
  direction: 'up' | 'down',
  allPokemon: Pokemon[],
) => {
  const { startNewBattle } = createBattleStarter(
    setCurrentBattle,
    rankedPokemon,
    forceSuggestionPriority,
    direction,
    allPokemon,
  );

  useEffect(() => {
    startNewBattle();
  }, [rankedPokemon, forceSuggestionPriority, direction]);

  return { startNewBattle };
};
