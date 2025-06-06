
import { useBattleProgressionMilestone } from "./useBattleProgressionMilestone";
import { useBattleProgressionIncrement } from "./useBattleProgressionIncrement";
import { useBattleProgressionReset } from "./useBattleProgressionReset";

export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: (value: boolean) => void,
  milestones: number[],
  generateRankings: (results: any[]) => void
) => {
  const { 
    checkMilestone, 
    isBattleGenerationBlocked,
    battleGenerationBlockedRef,
    resetMilestoneTracking,
    triggerMilestone
  } = useBattleProgressionMilestone(
    milestones,
    generateRankings,
    setShowingMilestone
  );

  const { 
    incrementBattlesCompleted, 
    clearMilestoneProcessing 
  } = useBattleProgressionIncrement(
    battlesCompleted,
    setBattlesCompleted,
    checkMilestone
  );

  const { 
    resetMilestone, 
    showingMilestoneRef 
  } = useBattleProgressionReset(
    setShowingMilestone,
    battleGenerationBlockedRef
  );

  // CRITICAL FIX: Enhanced method to check for missed milestones and trigger them immediately
  const checkForMissedMilestones = (currentBattleCount: number, battleResults: any[]) => {
    console.log(`🔍 MISSED MILESTONE CHECK: Checking for missed milestones with ${currentBattleCount} battles`);
    console.log(`🔍 MISSED MILESTONE CHECK: Available milestones: ${milestones.join(', ')}`);
    
    // Find all milestones that should have been triggered by now
    const missedMilestones = milestones.filter(milestone => 
      currentBattleCount >= milestone
    );
    
    console.log(`🔍 MISSED MILESTONE CHECK: All eligible milestones: ${missedMilestones.join(', ')}`);
    
    if (missedMilestones.length > 0) {
      // Get the highest milestone that was missed (most recent one)
      const latestMissedMilestone = Math.max(...missedMilestones);
      console.log(`🎯 MISSED MILESTONE FOUND: Triggering latest milestone ${latestMissedMilestone}`);
      
      // Force trigger the milestone view
      setShowingMilestone(true);
      return triggerMilestone(latestMissedMilestone, battleResults);
    }
    
    return false;
  };

  // CRITICAL FIX: Method to force check current battle count against milestones
  const forceCheckCurrentMilestone = (battleResults: any[]) => {
    console.log(`🔍 FORCE MILESTONE CHECK: Current battles completed: ${battlesCompleted}`);
    return checkForMissedMilestones(battlesCompleted, battleResults);
  };

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone,
    clearMilestoneProcessing,
    isBattleGenerationBlocked,
    resetMilestoneTracking,
    triggerMilestone,
    checkForMissedMilestones,
    forceCheckCurrentMilestone
  };
};
