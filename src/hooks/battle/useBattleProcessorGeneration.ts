
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleProcessorGeneration = (
  battleStarter?: any,
  integratedStartNewBattle?: (battleType: BattleType) => Pokemon[],
  setCurrentBattle?: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const generateNewBattle = useCallback((
    battleType: BattleType,
    timestamp: string
  ) => {
    console.log(`📝 [${timestamp}] [BATTLE_OUTCOME_FIX] No milestone hit - generating new battle immediately`);
    if (battleStarter && integratedStartNewBattle) {
      const newBattle = integratedStartNewBattle(battleType);
      if (newBattle && newBattle.length > 0) {
        console.log(`✅ [BATTLE_OUTCOME_FIX] New battle generated after processing: ${newBattle.map(p => p.name)}`);
        if (setCurrentBattle) {
          setCurrentBattle(newBattle);
        }
        return true;
      } else {
        console.error(`❌ [BATTLE_OUTCOME_FIX] Failed to generate new battle after processing`);
        return false;
      }
    }
    return false;
  }, [battleStarter, integratedStartNewBattle, setCurrentBattle]);

  return { generateNewBattle };
};
