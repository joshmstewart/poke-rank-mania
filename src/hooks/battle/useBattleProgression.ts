
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

  // CRITICAL FIX: Add method to check for missed milestones and trigger them
  const checkForMissedMilestones = (currentBattleCount: number, battleResults: any[]) => {
    console.log(`🔍 MISSED MILESTONE CHECK: Checking for missed milestones with ${currentBattleCount} battles`);
    
    const missedMilestones = milestones.filter(milestone => 
      currentBattleCount >= milestone
    );
    
    if (missedMilestones.length > 0) {
      const nextMissedMilestone = Math.min(...missedMilestones);
      console.log(`🎯 MISSED MILESTONE FOUND: Triggering milestone ${nextMissedMilestone}`);
      return triggerMilestone(nextMissedMilestone, battleResults);
    }
    
    return false;
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
    checkForMissedMilestones
  };
};
