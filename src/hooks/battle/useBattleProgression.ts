
import { useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle battle progression and milestone checks
 */
export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: any[]) => void,
) => {
  // Add a ref to track if a milestone is currently being shown
  const showingMilestoneRef = useRef(false);
  
  // Check if we've hit a milestone
  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]) => {
    if (milestones.includes(newBattlesCompleted)) {
      console.log(`useBattleProgression: Milestone reached at ${newBattlesCompleted} battles`);
      
      // Set the milestone flag
      showingMilestoneRef.current = true;
      
      // Force rankings generation with current results immediately
      generateRankings(battleResults);
      setShowingMilestone(true);
      
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
      });
      
      return true;
    }
    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const incrementBattlesCompleted = useCallback((callback?: (newCount: number) => void) => {
  setBattlesCompleted(prev => {
    const updated = prev + 1;
    if (callback) callback(updated);
    return updated;
  });
}, [setBattlesCompleted]);


  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current
  };
};
