
import { useState } from "react";
import { BattleType } from "@/hooks/battle/types";

export const useRankingUIState = () => {
  const [battleType, setBattleType] = useState<BattleType>("pairs");

  return {
    battleType,
    setBattleType
  };
};
