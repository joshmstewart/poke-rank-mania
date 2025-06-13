
import { useCallback, useMemo } from "react";
import { isMilestone, getNextMilestone, getMilestoneProgress } from "@/utils/battleMilestones";

export const useBattleMilestones = () => {
  // Generate milestones dynamically up to a reasonable limit
  const milestones = useMemo(() => {
    const maxMilestones = 1000; // Generate up to 1000 battles worth of milestones
    const result: number[] = [];
    for (let i = 25; i <= maxMilestones; i += 25) {
      result.push(i);
    }
    return result;
  }, []);

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
