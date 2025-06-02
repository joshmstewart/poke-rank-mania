
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
    
    // CRITICAL FIX: Check if we've crossed any milestone that hasn't been shown yet
    const crossedMilestones = milestones.filter(milestone => 
      newBattlesCompleted >= milestone && !milestoneTracker.current.has(milestone)
    );
    
    console.log(`🔍 MILESTONE CHECK: Crossed milestones not yet shown: ${crossedMilestones.join(', ')}`);
    
    if (crossedMilestones.length > 0) {
      // Show the lowest milestone that hasn't been shown yet
      const nextMilestone = Math.min(...crossedMilestones);
      console.log(`🎯 MILESTONE HIT: Triggering milestone ${nextMilestone} (current battles: ${newBattlesCompleted})`);
      
      // CRITICAL FIX: Shorter blocking period to prevent conflicts
      battleGenerationBlockedRef.current = true;
      
      // Immediately mark as tracked to prevent duplicates
      milestoneTracker.current.add(nextMilestone);
      lastTriggeredMilestoneRef.current = nextMilestone;
      
      try {
        console.log(`🔵 useBattleProgression: Generating rankings for milestone ${nextMilestone}`);
        generateRankings(battleResults);
        setShowingMilestone(true);
        
        console.log(`🚫 MILESTONE: Battle generation BLOCKED during milestone ${nextMilestone}`);
        return true;
      } catch (err) {
        console.error("Error generating rankings at milestone:", err);
        // Reset flags on error
        milestoneTracker.current.delete(nextMilestone);
        battleGenerationBlockedRef.current = false;
        return false;
      }
    }

    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const isBattleGenerationBlocked = useCallback(() => {
    return battleGenerationBlockedRef.current;
  }, []);

  // CRITICAL FIX: Add method to reset milestone tracking if needed
  const resetMilestoneTracking = useCallback(() => {
    console.log(`🔄 MILESTONE RESET: Clearing all milestone tracking`);
    milestoneTracker.current.clear();
    lastTriggeredMilestoneRef.current = null;
    battleGenerationBlockedRef.current = false;
  }, []);

  // CRITICAL FIX: Add method to manually trigger a specific milestone
  const triggerMilestone = useCallback((milestone: number, battleResults: any[]) => {
    console.log(`🎯 MANUAL MILESTONE TRIGGER: Forcing milestone ${milestone}`);
    
    // Remove from tracker if already there, then add it back
    milestoneTracker.current.delete(milestone);
    
    battleGenerationBlockedRef.current = true;
    milestoneTracker.current.add(milestone);
    lastTriggeredMilestoneRef.current = milestone;
    
    try {
      generateRankings(battleResults);
      setShowingMilestone(true);
      console.log(`✅ MANUAL MILESTONE: Successfully triggered milestone ${milestone}`);
      return true;
    } catch (err) {
      console.error("Error in manual milestone trigger:", err);
      milestoneTracker.current.delete(milestone);
      battleGenerationBlockedRef.current = false;
      return false;
    }
  }, [generateRankings, setShowingMilestone]);

  return {
    checkMilestone,
    isBattleGenerationBlocked,
    milestoneTracker,
    lastTriggeredMilestoneRef,
    battleGenerationBlockedRef,
    resetMilestoneTracking,
    triggerMilestone
  };
};
