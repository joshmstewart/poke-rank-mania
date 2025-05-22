import { useEffect } from 'react';
import { Pokemon } from '@/services/pokemon';
import { BattleType, SingleBattle } from './types';
import { BattleStarter } from './createBattleStarter';

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
      const losers = currentBattle.filter(p => !selectedPokemon.includes(p.id));

      const result: SingleBattle = {
        winner,
        losers,
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
