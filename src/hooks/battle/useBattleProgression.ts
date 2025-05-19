import { useCallback, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle battle progression and milestone checks
 */
export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: any[]) => void
) => {
  const showingMilestoneRef = useRef(false);
  const lastMilestoneShownRef = useRef(-1);

  // Check on mount or battles change — passive milestone detection
  useEffect(() => {
    if (showingMilestoneRef.current || battlesCompleted === lastMilestoneShownRef.current) return;

    const isExactMilestone = milestones.includes(battlesCompleted);
    const isEvery50Battles = battlesCompleted >= 100 && battlesCompleted % 50 === 0;

    if (isExactMilestone || isEvery50Battles) {
      console.log(`🔔 useEffect milestone hit: ${battlesCompleted}`);
      showingMilestoneRef.current = true;
      lastMilestoneShownRef.current = battlesCompleted;
      setShowingMilestone(true);
    }
  }, [battlesCompleted, milestones, setShowingMilestone]);

  // Actively invoked after battle result
  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]) => {
    if (newBattlesCompleted === lastMilestoneShownRef.current) return false;

    const isExactMilestone = milestones.includes(newBattlesCompleted);
    const isEvery50Battles = newBattlesCompleted >= 100 && newBattlesCompleted % 50 === 0;

    if (isExactMilestone || isEvery50Battles) {
      console.log(`🔔 checkMilestone triggered at ${newBattlesCompleted}`);

      // ✅ Set flags early to avoid re-triggering
      showingMilestoneRef.current = true;
      lastMilestoneShownRef.current = newBattlesCompleted;

      if (Array.isArray(battleResults) && battleResults.length > 0) {
        try {
          generateRankings(battleResults);
          setShowingMilestone(true);

          toast({
            title: "Milestone Reached!",
            description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
          });
        } catch (err) {
          console.error("Error generating rankings at milestone:", err);
        }
      } else {
        console.warn("No battle results to generate rankings");
      }

      return true;
    }

    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const incrementBattlesCompleted = useCallback((battleResults: any[]) => {
    setBattlesCompleted(prev => {
      const updated = prev + 1;
      checkMilestone(updated, battleResults);
      return updated;
    });
  }, [setBattlesCompleted, checkMilestone]);

  const resetMilestone = useCallback(() => {
    console.log("🧹 Resetting milestone flag");
    showingMilestoneRef.current = false;
    setShowingMilestone(false);
  }, [setShowingMilestone]);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone
  };
};
