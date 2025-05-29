
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleNavigation = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: any,
  setCurrentBattle: any,
  setSelectedPokemon: any,
  setBattlesCompleted: any,
  startNewBattle: (battleType: BattleType) => Pokemon[]
) => {
  const goBack = useCallback(() => {
    if (battleHistory.length === 0) return;

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);

    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setBattlesCompleted((prev: number) => Math.max(0, prev - 1));
  }, [battleHistory, setBattleHistory, setCurrentBattle, setSelectedPokemon, setBattlesCompleted]);

  const startNewBattleWrapper = useCallback((battleType: BattleType) => {
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] startNewBattleWrapper called`);
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 5));
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] battleType: ${battleType}`);
    
    const result = startNewBattle(battleType);
    
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Result:`, result?.map(p => `${p.name}(${p.id})`).join(' vs ') || 'null');
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Result length: ${result?.length || 0}`);
    
    return result;
  }, [startNewBattle]);

  return { goBack, startNewBattleWrapper };
};
