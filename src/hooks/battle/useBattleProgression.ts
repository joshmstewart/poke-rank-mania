import { useCallback, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

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

  useEffect(() => {
    return () => {
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
    };
  }, []);

  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]): boolean => {
    if (processingMilestoneRef.current || showingMilestoneRef.current) {
      console.log("🚫 Milestone already processing or showing, skipping");
      return false;
    }

    const isMilestone = milestones.includes(newBattlesCompleted) ||
                        (newBattlesCompleted >= 100 && newBattlesCompleted % 50 === 0);

    if (isMilestone && battleResults.length > 0) {
      processingMilestoneRef.current = true;
      console.log(`🎉 Milestone reached: ${newBattlesCompleted} battles`);

      try {
        generateRankings(battleResults);
        showingMilestoneRef.current = true;
console.log("🔴 useBattleProgression: setShowingMilestone(true) triggered");
setShowingMilestone(true);

        toast({
          title: "Milestone Reached!",
          description: `You've completed ${newBattlesCompleted} battles.`,
        });
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

  const incrementBattlesCompleted = useCallback((battleResults: any[]) => {
    if (incrementInProgressRef.current) {
      console.log("⏳ Increment already in progress, skipping");
      return;
    }

    incrementInProgressRef.current = true;
    setBattlesCompleted(prev => {
      const updated = prev + 1;
      milestoneTimeoutRef.current = setTimeout(() => {
        checkMilestone(updated, battleResults);
        incrementInProgressRef.current = false;
      }, 100);
      return updated;
    });
  }, [setBattlesCompleted, checkMilestone]);

  const resetMilestone = useCallback(() => {
    console.log("🔄 Resetting milestone state");
    showingMilestoneRef.current = false;
    processingMilestoneRef.current = false;
    setShowingMilestone(false);
  }, [setShowingMilestone]);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone
  };
};
