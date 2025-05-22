import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Pokemon } from '@/services/pokemon';
import { BattleSelectionState, BattleType, SingleBattle } from './types';

export const useBattleStarterIntegration = (
  battleSelectionState: BattleSelectionState,
  setBattleHistory: (history: SingleBattle[]) => void,
  setSelectedPokemon: (pokemonIds: number[]) => void,
  battleHistory: SingleBattle[],
  allPokemon: Pokemon[],
) => {
  const {
    currentBattle,
    resetAfterMilestone,
    resetSuggestionPriority,
    resetSuggestionState,
    startNewBattle,
  } = battleSelectionState;

  const { saveToStorage, loadFromStorage } = useLocalStorage();

  useEffect(() => {
    const savedBattleHistory = loadFromStorage<SingleBattle[]>('battleHistory');
    if (savedBattleHistory) {
      setBattleHistory(savedBattleHistory);
    }

    const savedSuggestions = loadFromStorage<any[]>('savedSuggestions');
    if (savedSuggestions && savedSuggestions.length) {
      resetSuggestionState();
    }

    startNewBattle();
  }, []);

  useEffect(() => {
    saveToStorage('battleHistory', battleHistory);
  }, [battleHistory]);

  const handleSelection = (winnerId: number, loserIds: number[], battleType: BattleType) => {
    const newBattle: SingleBattle = {
      winnerId,
      loserIds,
      battleType,
      timestamp: Date.now(),
    };

    const updatedHistory = [...battleHistory, newBattle];
    setBattleHistory(updatedHistory);
    setSelectedPokemon([]);

    startNewBattle();
  };

  const handleMilestoneCompletion = () => {
    resetAfterMilestone();
    resetSuggestionPriority();
    resetSuggestionState();
    startNewBattle();
  };

  return {
    handleSelection,
    handleMilestoneCompletion,
  };
};
