
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
    if (processingMilestoneRef.current) {
      console.log("🚫 Milestone already processing, skipping");
      return false;
    }

    // Check if this is a milestone battle count
    const isMilestone = milestones.includes(newBattlesCompleted) || 
                        (newBattlesCompleted >= 100 && newBattlesCompleted % 50 === 0);
    
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
        generateRankings(battleResults);
        
        // Show the milestone view
        setShowingMilestone(true);
        console.log("🔴 useBattleProgression: setShowingMilestone(true) triggered");
        
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

  // FIXED: Updated to ensure we return the milestone number or null
  const incrementBattlesCompleted = useCallback((battleResults: any[]): number | null => {
    if (incrementInProgressRef.current) {
      console.log("⏳ Increment already in progress, skipping");
      return null;
    }

    let updatedBattleCount: number = 0;
    incrementInProgressRef.current = true;
    
    setBattlesCompleted(prev => {
      updatedBattleCount = prev + 1;
      return updatedBattleCount;
    });
    
    // Check if this is a milestone
    milestoneTimeoutRef.current = setTimeout(() => {
      checkMilestone(updatedBattleCount, battleResults);
      incrementInProgressRef.current = false;
    }, 100);
    
    // Return the updated battle count if it's a milestone
    if (milestones.includes(updatedBattleCount) || 
        (updatedBattleCount >= 100 && updatedBattleCount % 50 === 0)) {
      return updatedBattleCount;
    }
    
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
