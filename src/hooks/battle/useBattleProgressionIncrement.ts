
import { useCallback, useRef } from "react";

export const useBattleProgressionIncrement = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  checkMilestone: (
    newBattlesCompleted: number,
    battleResults: any[]
  ) => number | null
) => {
  const incrementInProgressRef = useRef(false);

  const incrementBattlesCompleted = useCallback((battleResults: any[]): number | null => {
    if (incrementInProgressRef.current) {
      console.log("⏳ Increment already in progress, skipping");
      return null;
    }

    incrementInProgressRef.current = true;
    
    const newBattleCount = battlesCompleted + 1;
    console.log(`📈 BATTLE COUNT CALCULATION: ${battlesCompleted} -> ${newBattleCount}`);
    
    setBattlesCompleted(newBattleCount);
    console.log(`✅ setBattlesCompleted called with: ${newBattleCount}`);
    
    const milestoneTriggered = checkMilestone(newBattleCount, battleResults);

    if (milestoneTriggered !== null) {
      console.log(
        `✅ MILESTONE SUCCESSFULLY TRIGGERED: ${milestoneTriggered}`
      );
      incrementInProgressRef.current = false;
      return milestoneTriggered;
    }
    
    incrementInProgressRef.current = false;
    return null;
  }, [setBattlesCompleted, checkMilestone, battlesCompleted]);

  const clearMilestoneProcessing = useCallback(() => {
    console.log("🧹 Clearing milestone processing flags");
    incrementInProgressRef.current = false;
  }, []);

  return {
    incrementBattlesCompleted,
    clearMilestoneProcessing
  };
};
