
import { useCallback, useMemo } from "react";

export const useBattleMilestones = () => {
  // CRITICAL FIX: Generate milestones dynamically based on every 25 battles pattern
  const milestones = useMemo(() => {
    const milestoneArray = [];
    // Generate milestones every 25 battles up to a reasonable limit
    for (let i = 25; i <= 1000; i += 25) {
      milestoneArray.push(i);
    }
    console.log(`🏆 [MILESTONE_DYNAMIC] Generated milestones every 25 battles:`, milestoneArray.slice(0, 10), '...'); 
    return milestoneArray;
  }, []);

  const checkForMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] ===== Checking Milestone =====`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Battle number: ${newBattlesCompleted}`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Checking if ${newBattlesCompleted} is divisible by 25`);
    
    // CRITICAL FIX: Check if battle count is exactly divisible by 25
    const isMilestone = newBattlesCompleted > 0 && newBattlesCompleted % 25 === 0;
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Is milestone? ${isMilestone} (${newBattlesCompleted} % 25 = ${newBattlesCompleted % 25})`);
    
    if (isMilestone) {
      console.log(`🏆🏆🏆 [MILESTONE_HIT] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      return true;
    }
    
    return false;
  }, []);

  return {
    milestones,
    checkForMilestone
  };
};
