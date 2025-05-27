import { useCallback, useRef, useEffect } from "react";

export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: (value: boolean) => void,
  milestones: number[],
  generateRankings: (results: any[]) => void
) => {
  const showingMilestoneRef = useRef(false);
  const incrementInProgressRef = useRef(false);
  const milestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const milestoneTracker = useRef<Set<number>>(new Set());
  const lastTriggeredMilestoneRef = useRef<number | null>(null);
  const battleGenerationBlockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
    };
  }, []);

  // CRITICAL FIX: Reduced battle generation blocking period
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
      showingMilestoneRef.current = true;
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
        showingMilestoneRef.current = false;
        battleGenerationBlockedRef.current = false;
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
    
    const milestoneTriggered = checkMilestone(newBattleCount, battleResults);
    
    if (milestoneTriggered) {
      console.log(`✅ MILESTONE SUCCESSFULLY TRIGGERED for battle ${newBattleCount}`);
      incrementInProgressRef.current = false;
      return newBattleCount;
    }
    
    incrementInProgressRef.current = false;
    return null;
  }, [setBattlesCompleted, checkMilestone, battlesCompleted]);

  // CRITICAL FIX: Reduced delay to prevent auto-trigger conflicts
  const resetMilestone = useCallback(() => {
    console.log("🔄 Resetting milestone state in useBattleProgression");
    showingMilestoneRef.current = false;
    setShowingMilestone(false);
    lastTriggeredMilestoneRef.current = null;
    
    // CRITICAL FIX: Much shorter delay to prevent auto-trigger conflicts
    setTimeout(() => {
      battleGenerationBlockedRef.current = false;
      console.log("✅ MILESTONE: Battle generation UNBLOCKED after milestone dismissal (REDUCED delay)");
      
      // Dispatch event to signal it's safe to generate new battles
      const unblockEvent = new CustomEvent('milestone-unblocked', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(unblockEvent);
    }, 400); // Reduced from 1500ms to 400ms
    
    console.log("✅ useBattleProgression: milestone tracking state reset");
  }, [setShowingMilestone]);

  const clearMilestoneProcessing = useCallback(() => {
    console.log("🧹 Clearing milestone processing flags");
    incrementInProgressRef.current = false;
  }, []);

  // CRITICAL FIX: Check if battle generation is blocked
  const isBattleGenerationBlocked = useCallback(() => {
    return battleGenerationBlockedRef.current;
  }, []);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone,
    clearMilestoneProcessing,
    isBattleGenerationBlocked
  };
};
