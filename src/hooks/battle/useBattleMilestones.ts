
import { useCallback, useMemo } from "react";
import { getDefaultBattleMilestones } from "@/utils/battleMilestones";

export const useBattleMilestones = () => {
  const milestones = useMemo(() => getDefaultBattleMilestones(), []);

  const checkForMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] ===== Checking Milestone =====`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Battle number: ${newBattlesCompleted}`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Available milestones: ${milestones.join(', ')}`);
    
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Is milestone? ${isMilestone}`);
    
    if (isMilestone) {
      console.log(`🏆🏆🏆 [MILESTONE_HIT] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      return true;
    }
    
    return false;
  }, [milestones]);

  return {
    milestones,
    checkForMilestone
  };
};
