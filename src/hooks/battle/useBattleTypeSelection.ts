
import { useState } from "react";
import { BattleType } from "./types";

export const useBattleTypeSelection = () => {
  const getInitialBattleType = (): BattleType => {
    const stored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType | null;
    const defaultType: BattleType = "pairs";
    if (!stored || (stored !== "pairs" && stored !== "triplets")) {
      localStorage.setItem('pokemon-ranker-battle-type', defaultType);
      return defaultType;
    }
    return stored;
  };

  const [currentBattleType, setCurrentBattleType] = useState<BattleType>(getInitialBattleType());

  return {
    currentBattleType,
    setCurrentBattleType
  };
};
