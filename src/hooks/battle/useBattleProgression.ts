
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
  const lastProcessedBattleCountRef = useRef<number>(0); // Track the last processed count

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

    // CRITICAL FIX: Check for ANY skipped milestones between last processed and current
    const lastProcessedCount = lastProcessedBattleCountRef.current;
    const skippedMilestones = milestones.filter(m => 
      m > lastProcessedCount && 
      m <= newBattlesCompleted && 
      !milestoneTracker.current.has(m)
    );
    
    console.log(`📊 [MILESTONE_SKIP_FIX] Last processed: ${lastProcessedCount}, Current: ${newBattlesCompleted}`);
    console.log(`📊 [MILESTONE_SKIP_FIX] Found milestones to process: ${skippedMilestones.join(', ')}`);
    
    if (skippedMilestones.length > 0) {
      // Process the earliest milestone that was skipped
      const milestoneToProcess = Math.min(...skippedMilestones);
      console.log(`🎯 [MILESTONE_SKIP_FIX] Processing milestone: ${milestoneToProcess}`);
      
      milestoneTracker.current.add(milestoneToProcess);
      processingMilestoneRef.current = true;
      showingMilestoneRef.current = true;
      lastTriggeredMilestoneRef.current = milestoneToProcess;
      
      try {
        console.log(`🔵 useBattleProgression: Generating rankings for milestone ${milestoneToProcess}`);
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
    
    const newBattleCount = battlesCompleted + 1;
    console.log(`📈 BATTLE COUNT CALCULATION: ${battlesCompleted} -> ${newBattleCount}`);
    
    setBattlesCompleted(newBattleCount);
    console.log(`✅ setBattlesCompleted called with: ${newBattleCount}`);
    
    // CRITICAL FIX: Update last processed count BEFORE checking milestones
    const previousCount = lastProcessedBattleCountRef.current;
    lastProcessedBattleCountRef.current = newBattleCount;
    
    // Check for milestones with the previous count context
    console.log(`🔍 MILESTONE CHECK: Previous processed: ${previousCount}, New: ${newBattleCount}`);
    const milestoneTriggered = checkMilestone(newBattleCount, battleResults);
    
    if (milestoneTriggered) {
      console.log(`✅ MILESTONE SUCCESSFULLY TRIGGERED for battle ${newBattleCount}`);
      incrementInProgressRef.current = false;
      return newBattleCount;
    }
    
    incrementInProgressRef.current = false;
    return null;
  }, [setBattlesCompleted, checkMilestone, battlesCompleted]);

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
