
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
    console.log(`🔍 checkMilestone called with ${newBattlesCompleted} battles`);
    
    if (processingMilestoneRef.current) {
      console.log("🚫 Milestone already processing, skipping");
      return false;
    }

    // Check if this is a milestone battle count
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 Battle ${newBattlesCompleted} is milestone: ${isMilestone}`);
    
    // Check if we've already triggered this milestone
    if (isMilestone && !milestoneTracker.current.has(newBattlesCompleted)) {
      // Avoid duplicate triggers
      if (lastTriggeredMilestoneRef.current === newBattlesCompleted) {
        console.log(`🔄 Milestone ${newBattlesCompleted} was just triggered, ignoring duplicate`);
        return false;
      }
      
      milestoneTracker.current.add(newBattlesCompleted);
      processingMilestoneRef.current = true;
      showingMilestoneRef.current = true;
      lastTriggeredMilestoneRef.current = newBattlesCompleted;
      console.log(`🎉 Milestone reached: ${newBattlesCompleted} battles`);

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
      console.log(`📈 incrementBattlesCompleted: Updated battle count to ${updatedBattleCount}`);
      return updatedBattleCount;
    });
    
    // Check if this is a milestone immediately after updating
    const isMilestone = milestones.includes(updatedBattleCount);
    console.log(`🎯 Battle ${updatedBattleCount} milestone check: ${isMilestone}`);
    
    if (isMilestone) {
      console.log(`🚀 Triggering milestone check for battle ${updatedBattleCount}`);
      // Trigger milestone check immediately
      setTimeout(() => {
        checkMilestone(updatedBattleCount, battleResults);
        incrementInProgressRef.current = false;
      }, 50);
      
      return updatedBattleCount;
    } else {
      incrementInProgressRef.current = false;
      return null;
    }
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
