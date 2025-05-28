
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
    battleGenerationBlockedRef 
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

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone,
    clearMilestoneProcessing,
    isBattleGenerationBlocked
  };
};
