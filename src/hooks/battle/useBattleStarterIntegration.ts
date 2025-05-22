
import { useEffect } from 'react';
import { Pokemon } from '@/services/pokemon';
import { BattleType, SingleBattle } from './types';

// Define BattleStarter interface
export interface BattleStarter {
  startNewBattle: () => void;
}

export const useBattleStarterIntegration = (
  currentBattle: Pokemon[],
  selectedPokemon: number[],
  battleType: BattleType,
  battleStarter: BattleStarter,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  processBattleResult: (battle: SingleBattle) => void,
  setIsProcessingResult: (isProcessing: boolean) => void
) => {
  useEffect(() => {
    if (selectedPokemon.length === (battleType === 'pair' ? 1 : 3)) {
      setIsProcessingResult(true);
      const winner = currentBattle.find(p => selectedPokemon.includes(p.id));
      const loser = currentBattle.filter(p => !selectedPokemon.includes(p.id));

      const result: SingleBattle = {
        winner,
        loser: loser[0], // Fix: use only the first loser for compatibility with SingleBattle type
        battleType,
      };

      processBattleResult(result);

      setBattleHistory(prev => [
        ...prev,
        {
          battle: currentBattle,
          selected: selectedPokemon,
        },
      ]);

      setIsProcessingResult(false);
      battleStarter.startNewBattle();
    }
  }, [selectedPokemon]);
};
