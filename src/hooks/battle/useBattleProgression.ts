
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
  const lastBattleCountRef = useRef<number>(0);

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

    // CRITICAL FIX: Enhanced milestone detection to prevent skipping
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 Battle ${newBattlesCompleted} is milestone: ${isMilestone}`);
    
    // Check if we've already triggered this milestone
    if (isMilestone && !milestoneTracker.current.has(newBattlesCompleted)) {
      // CRITICAL FIX: Additional check to prevent skipping due to rapid updates
      const previousBattleCount = lastBattleCountRef.current;
      console.log(`📊 [MILESTONE_SKIP_FIX] Previous: ${previousBattleCount}, Current: ${newBattlesCompleted}`);
      
      // Check if we skipped any milestones between previous and current count
      const skippedMilestones = milestones.filter(m => 
        m > previousBattleCount && 
        m < newBattlesCompleted && 
        !milestoneTracker.current.has(m)
      );
      
      if (skippedMilestones.length > 0) {
        console.log(`⚠️ [MILESTONE_SKIP_FIX] Detected skipped milestones: ${skippedMilestones.join(', ')}`);
        // Process the earliest skipped milestone instead
        const earliestSkipped = Math.min(...skippedMilestones);
        console.log(`🔧 [MILESTONE_SKIP_FIX] Processing skipped milestone: ${earliestSkipped}`);
        
        milestoneTracker.current.add(earliestSkipped);
        processingMilestoneRef.current = true;
        showingMilestoneRef.current = true;
        lastTriggeredMilestoneRef.current = earliestSkipped;
        
        try {
          console.log(`🔵 useBattleProgression: Generating rankings for skipped milestone ${earliestSkipped}`);
          generateRankings(battleResults);
          setShowingMilestone(true);
          return true;
        } catch (err) {
          console.error("Error generating rankings at skipped milestone:", err);
          processingMilestoneRef.current = false;
          showingMilestoneRef.current = false;
          return false;
        }
      }
      
      milestoneTracker.current.add(newBattlesCompleted);
      processingMilestoneRef.current = true;
      showingMilestoneRef.current = true;
      lastTriggeredMilestoneRef.current = newBattlesCompleted;
      console.log(`🎉 MILESTONE TRIGGERED: ${newBattlesCompleted} battles - showing milestone!`);

      try {
        console.log(`🔵 useBattleProgression: Generating rankings for milestone ${newBattlesCompleted}`);
        generateRankings(battleResults);
        setShowingMilestone(true);
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
    
    // CRITICAL FIX: Store the previous battle count before updating
    const previousCount = battlesCompleted;
    lastBattleCountRef.current = previousCount;
    
    const newBattleCount = battlesCompleted + 1;
    console.log(`📈 BATTLE COUNT CALCULATION: ${battlesCompleted} -> ${newBattleCount}`);
    
    setBattlesCompleted(newBattleCount);
    console.log(`✅ setBattlesCompleted called with: ${newBattleCount}`);
    
    // Use the calculated newBattleCount for milestone check
    console.log(`🔍 MILESTONE CHECK WITH CALCULATED VALUE: Checking ${newBattleCount} against milestones`);
    const isMilestone = milestones.includes(newBattleCount);
    
    if (isMilestone) {
      console.log(`🚀 MILESTONE DETECTED: ${newBattleCount} - triggering milestone display`);
      
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
