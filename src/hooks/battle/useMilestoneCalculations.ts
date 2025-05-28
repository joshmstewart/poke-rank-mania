
import { useCallback } from "react";

export const useMilestoneCalculations = (battlesCompleted: number, milestones: number[]) => {
  // Get the next milestone
  const getNextMilestone = useCallback(() => {
    console.log(`🎯 [MILESTONE_CALC] Finding next milestone for ${battlesCompleted} battles completed`);
    console.log(`🎯 [MILESTONE_CALC] Available milestones:`, milestones);
    
    const nextMilestone = milestones.find(m => m > battlesCompleted);
    const result = nextMilestone || (battlesCompleted + 50); // If no milestone found, show next 50 battles
    
    console.log(`🎯 [MILESTONE_CALC] Next milestone: ${result}`);
    return result;
  }, [battlesCompleted, milestones]);
  
  // Calculate progress towards next milestone
  const getMilestoneProgress = useCallback(() => {
    // Find the next milestone
    const nextMilestone = getNextMilestone();
    
    // Find the previous milestone
    const prevMilestoneIndex = milestones.findIndex(m => m > battlesCompleted) - 1;
    const prevMilestone = prevMilestoneIndex >= 0 ? milestones[prevMilestoneIndex] : 0;
    
    console.log(`🎯 [MILESTONE_PROGRESS] Progress calculation:`, {
      battlesCompleted,
      prevMilestone,
      nextMilestone,
      prevMilestoneIndex
    });
    
    // Calculate progress percentage between milestones
    if (nextMilestone === prevMilestone) return 100; // Avoid division by zero
    const progress = Math.min(100, Math.max(0, 
      ((battlesCompleted - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    ));
    
    const roundedProgress = Math.round(progress);
    console.log(`🎯 [MILESTONE_PROGRESS] Calculated progress: ${roundedProgress}%`);
    
    return roundedProgress; // Round to nearest integer for cleaner display
  }, [battlesCompleted, milestones, getNextMilestone]);
  
  return {
    getNextMilestone,
    getMilestoneProgress
  };
};
