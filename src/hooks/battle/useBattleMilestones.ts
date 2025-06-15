
import { useCallback, useMemo } from "react";
import { isMilestone, getNextMilestone, getMilestoneProgress, generateMilestones } from "@/utils/battleMilestones";

export type Milestone = {
  value: number;
  label: string;
};

export const useBattleMilestones = (battlesCompleted: number = 0) => {
  // Generate milestones dynamically based on current battle count
  const milestones = useMemo(() => {
    return generateMilestones(battlesCompleted);
  }, [battlesCompleted]);

  const checkForMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] ===== Checking Milestone =====`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Battle number: ${newBattlesCompleted}`);
    
    const isMilestoneReached = isMilestone(newBattlesCompleted);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Is milestone? ${isMilestoneReached}`);
    
    if (isMilestoneReached) {
      console.log(`🏆🏆🏆 [MILESTONE_HIT] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      return true;
    }
    
    return false;
  }, []);

  const getNextMilestoneInfo = useCallback((battleCount: number) => {
    return {
      next: getNextMilestone(battleCount),
      progress: getMilestoneProgress(battleCount)
    };
  }, []);

  return {
    milestones,
    checkForMilestone,
    getNextMilestoneInfo,
    isMilestone
  };
};
