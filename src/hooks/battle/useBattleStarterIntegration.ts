
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { createBattleStarter } from "./createBattleStarter";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;
    
    return createBattleStarter(allPokemon, currentRankings);
  }, [allPokemon, currentRankings]);

  const startNewBattle = (battleType: any) => {
    if (!battleStarter) return [];
    
    const result = battleStarter.startNewBattle(battleType);
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
    }
    return result;
  };

  return {
    battleStarter,
    startNewBattle
  };
};
