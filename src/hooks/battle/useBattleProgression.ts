
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
        
        // CRITICAL FIX: Show the milestone immediately and prevent it from being cleared
        console.log(`🔴 useBattleProgression: FORCING milestone display for ${newBattlesCompleted}`);
        setShowingMilestone(true);
        
        // Don't reset processing flag immediately - let the display handle it
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

    incrementInProgressRef.current = true;
    
    // CRITICAL FIX: Calculate the new battle count first, then use it consistently
    const newBattleCount = battlesCompleted + 1;
    console.log(`📈 BATTLE COUNT CALCULATION: ${battlesCompleted} -> ${newBattleCount}`);
    
    // Update the state with the calculated value
    setBattlesCompleted(newBattleCount);
    console.log(`✅ setBattlesCompleted called with: ${newBattleCount}`);
    
    // CRITICAL FIX: Use the calculated newBattleCount for milestone check instead of state
    console.log(`🔍 MILESTONE CHECK WITH CALCULATED VALUE: Checking ${newBattleCount} against milestones`);
    const isMilestone = milestones.includes(newBattleCount);
    
    if (isMilestone) {
      console.log(`🚀 MILESTONE DETECTED: ${newBattleCount} - triggering milestone display`);
      
      // Trigger milestone check with the calculated value
      const milestoneTriggered = checkMilestone(newBattleCount, battleResults);
      
      if (milestoneTriggered) {
        console.log(`✅ MILESTONE SUCCESSFULLY TRIGGERED: ${newBattleCount}`);
        incrementInProgressRef.current = false;
        return newBattleCount;
      }
    }
    
    incrementInProgressRef.current = false;
    return null;
  }, [setBattlesCompleted, checkMilestone, milestones, battlesCompleted]);

  const resetMilestone = useCallback(() => {
    console.log("🔄 Resetting milestone state in useBattleProgression");
    showingMilestoneRef.current = false;
    processingMilestoneRef.current = false;
    setShowingMilestone(false);
    // DON'T clear the tracker - we want to remember which milestones we've hit
    lastTriggeredMilestoneRef.current = null;
    console.log("✅ useBattleProgression: milestone tracking state reset");
  }, [setShowingMilestone]);

  const clearMilestoneProcessing = useCallback(() => {
    console.log("🧹 Clearing milestone processing flags");
    processingMilestoneRef.current = false;
    incrementInProgressRef.current = false;
  }, []);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone,
    clearMilestoneProcessing
  };
};
