
import { useCallback, useMemo } from "react";

export const useBattleMilestones = () => {
  const milestones = useMemo(() => [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000], []);

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
