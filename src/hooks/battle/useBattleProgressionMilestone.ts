
import { useCallback, useRef } from "react";

export const useBattleProgressionMilestone = (
  milestones: number[],
  generateRankings: (results: any[]) => void,
  setShowingMilestone: (value: boolean) => void
) => {
  const milestoneTracker = useRef<Set<number>>(new Set());
  const lastTriggeredMilestoneRef = useRef<number | null>(null);
  const battleGenerationBlockedRef = useRef(false);

  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]): boolean => {
    console.log(`🔍 MILESTONE CHECK: Checking ${newBattlesCompleted} battles against milestones: ${milestones.join(', ')}`);
    console.log(`🔍 MILESTONE CHECK: Already tracked milestones: ${Array.from(milestoneTracker.current).join(', ')}`);
    
    const isExactMilestone = milestones.includes(newBattlesCompleted);
    const notYetTracked = !milestoneTracker.current.has(newBattlesCompleted);
    
    console.log(`🔍 MILESTONE CHECK: Battle ${newBattlesCompleted} - isExactMilestone: ${isExactMilestone}, notYetTracked: ${notYetTracked}`);
    
    if (isExactMilestone && notYetTracked) {
      console.log(`🎯 MILESTONE HIT: Battle ${newBattlesCompleted} reached milestone!`);
      
      // CRITICAL FIX: Shorter blocking period to prevent conflicts
      battleGenerationBlockedRef.current = true;
      
      // Immediately mark as tracked to prevent duplicates
      milestoneTracker.current.add(newBattlesCompleted);
      lastTriggeredMilestoneRef.current = newBattlesCompleted;
      
      try {
        console.log(`🔵 useBattleProgression: Generating rankings for milestone ${newBattlesCompleted}`);
        generateRankings(battleResults);
        setShowingMilestone(true);
        
        console.log(`🚫 MILESTONE: Battle generation BLOCKED during milestone ${newBattlesCompleted} (REDUCED period)`);
        return true;
      } catch (err) {
        console.error("Error generating rankings at milestone:", err);
        // Reset flags on error
        milestoneTracker.current.delete(newBattlesCompleted);
        battleGenerationBlockedRef.current = false;
        return false;
      }
    }

    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const isBattleGenerationBlocked = useCallback(() => {
    return battleGenerationBlockedRef.current;
  }, []);

  return {
    checkMilestone,
    isBattleGenerationBlocked,
    milestoneTracker,
    lastTriggeredMilestoneRef,
    battleGenerationBlockedRef
  };
};
