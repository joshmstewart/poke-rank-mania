
import { useCallback, useRef, useEffect } from "react";

export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: (value: boolean) => void,
  milestones: number[],
  generateRankings: (results: any[]) => void
) => {
  const showingMilestoneRef = useRef(false);
  const processingMilestoneRef = useRef(false);
  const incrementInProgressRef = useRef(false);
  const milestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const milestoneTracker = useRef<Set<number>>(new Set());
  const lastTriggeredMilestoneRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
    };
  }, []);

  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]): boolean => {
    console.log(`🔍 MILESTONE CHECK: Checking ${newBattlesCompleted} battles against milestones: ${milestones.join(', ')}`);
    
    if (processingMilestoneRef.current) {
      console.log("🚫 Milestone already processing, skipping");
      return false;
    }

    // Check if this is a milestone battle count
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 Battle ${newBattlesCompleted} is milestone: ${isMilestone}`);
    
    // Check if we've already triggered this milestone
    if (isMilestone && !milestoneTracker.current.has(newBattlesCompleted)) {
      milestoneTracker.current.add(newBattlesCompleted);
      processingMilestoneRef.current = true;
      showingMilestoneRef.current = true;
      lastTriggeredMilestoneRef.current = newBattlesCompleted;
      console.log(`🎉 MILESTONE TRIGGERED: ${newBattlesCompleted} battles - showing milestone!`);

      try {
        // Generate rankings based on the battle results
        console.log(`🔵 useBattleProgression: Generating rankings for milestone ${newBattlesCompleted}`);
        generateRankings(battleResults);
        
        // Show the milestone view
        console.log(`🔴 useBattleProgression: setShowingMilestone(true) triggered for milestone ${newBattlesCompleted}`);
        setShowingMilestone(true);
        
        // Reset the processing flag after a short delay
        setTimeout(() => {
          processingMilestoneRef.current = false;
        }, 500);
        
        return true;
      } catch (err) {
        console.error("Error generating rankings at milestone:", err);
        processingMilestoneRef.current = false;
        showingMilestoneRef.current = false;
        return false;
      }
    }

    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const incrementBattlesCompleted = useCallback((battleResults: any[]): number | null => {
    if (incrementInProgressRef.current) {
      console.log("⏳ Increment already in progress, skipping");
      return null;
    }

    let updatedBattleCount: number = 0;
    incrementInProgressRef.current = true;
    
    setBattlesCompleted(prev => {
      updatedBattleCount = prev + 1;
      console.log(`📈 BATTLE COUNT UPDATED: ${prev} -> ${updatedBattleCount}`);
      return updatedBattleCount;
    });
    
    // CRITICAL FIX: Check milestone immediately after setting battle count
    console.log(`🔍 IMMEDIATE MILESTONE CHECK: Checking ${updatedBattleCount} against milestones`);
    const isMilestone = milestones.includes(updatedBattleCount);
    
    if (isMilestone) {
      console.log(`🚀 MILESTONE DETECTED: ${updatedBattleCount} - triggering milestone display`);
      
      // Trigger milestone check immediately without delay
      const milestoneTriggered = checkMilestone(updatedBattleCount, battleResults);
      
      if (milestoneTriggered) {
        console.log(`✅ MILESTONE SUCCESSFULLY TRIGGERED: ${updatedBattleCount}`);
        incrementInProgressRef.current = false;
        return updatedBattleCount;
      }
    }
    
    incrementInProgressRef.current = false;
    return null;
  }, [setBattlesCompleted, checkMilestone, milestones]);

  const resetMilestone = useCallback(() => {
    console.log("🔄 Resetting milestone state in useBattleProgression");
    showingMilestoneRef.current = false;
    processingMilestoneRef.current = false;
    setShowingMilestone(false);
    milestoneTracker.current.clear();
    lastTriggeredMilestoneRef.current = null;
    console.log("✅ useBattleProgression: milestone tracking state fully reset");
  }, [setShowingMilestone]);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone
  };
};
