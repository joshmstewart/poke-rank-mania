import { useCallback } from "react";
import { BattleType, SingleBattle } from "./types";

export const useBattleActions = (
  setShowingMilestone: (value: boolean) => void,
  startNewBattle: (battleType: BattleType) => void,
  battleType: BattleType
) => {

  const handleContinueBattles = useCallback(() => {
    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered (ContinueBattles)");
    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered");
setShowingMilestone(false);

    startNewBattle(battleType);
  }, [setShowingMilestone, startNewBattle, battleType]);

  const handleNewBattleSet = useCallback(() => {
    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered (NewBattleSet)");
    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered");
setShowingMilestone(false);

    startNewBattle(battleType);
  }, [setShowingMilestone, startNewBattle, battleType]);

  return {
    handleContinueBattles,
    handleNewBattleSet,
  };
};
