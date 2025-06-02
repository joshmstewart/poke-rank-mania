
import { useCallback } from "react";

export const useMilestoneCalculations = (
  battlesCompleted: number,
  milestones: number[] | number,
  finalRankings?: any[],
  battleHistory?: any[]
) => {
  // Handle both old signature (4 params) and new signature (2 params)
  const actualMilestones = Array.isArray(milestones) ? milestones : [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  const actualFinalRankings = finalRankings || [];
  const actualBattleHistory = battleHistory || [];
  const completionPercentage = typeof milestones === 'number' ? milestones : 0;

  const calculateCompletionPercentage = useCallback(() => {
    const completed = battlesCompleted;
    const totalPossible = 800;
    const percentage = Math.min((completed / totalPossible) * 100, 100);
    console.log(`🔧 [MILESTONE_CALC_DEBUG] Completion calculation: ${completed}/${totalPossible} = ${percentage}%`);
    return percentage;
  }, [battlesCompleted]);

  const getSnapshotForMilestone = useCallback(() => {
    const snapshot = {
      rankings: [...actualFinalRankings],
      battleHistory: [...actualBattleHistory],
      battlesCompleted,
      completionPercentage
    };
    console.log(`🔧 [MILESTONE_SNAPSHOT_DEBUG] Created snapshot with ${snapshot.rankings.length} rankings`);
    return JSON.stringify(snapshot);
  }, [actualFinalRankings, actualBattleHistory, battlesCompleted, completionPercentage]);

  const getNextMilestone = useCallback(() => {
    // Find the next milestone after current battles completed
    const nextMilestone = actualMilestones.find(milestone => milestone > battlesCompleted);
    return nextMilestone || actualMilestones[actualMilestones.length - 1];
  }, [battlesCompleted, actualMilestones]);

  const getMilestoneProgress = useCallback(() => {
    const nextMilestone = getNextMilestone();
    const previousMilestone = actualMilestones
      .filter(milestone => milestone <= battlesCompleted)
      .pop() || 0;
    
    const progressRange = nextMilestone - previousMilestone;
    const currentProgress = battlesCompleted - previousMilestone;
    
    return progressRange > 0 ? (currentProgress / progressRange) * 100 : 0;
  }, [battlesCompleted, actualMilestones, getNextMilestone]);

  return {
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    getNextMilestone,
    getMilestoneProgress
  };
};
