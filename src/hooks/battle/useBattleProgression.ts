
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
    // Determine if we should show milestone
    // 1. Check if exactly on a milestone number
    const isExactMilestone = milestones.includes(newBattlesCompleted);
    
    // 2. Check if we've gone 50 battles since last milestone
    const nextMilestone = milestones.find(m => m > newBattlesCompleted) || Infinity;
    const prevMilestone = [...milestones].reverse().find(m => m <= newBattlesCompleted) || 0;
    const battlesFromLastMilestone = newBattlesCompleted - prevMilestone;
    const isEvery50Battles = newBattlesCompleted >= 100 && battlesFromLastMilestone > 0 && battlesFromLastMilestone % 50 === 0;
    
    if (isExactMilestone || isEvery50Battles) {
      console.log(`useBattleProgression: Milestone reached at ${newBattlesCompleted} battles`);
      
      // Set the milestone flag
      showingMilestoneRef.current = true;
      
      // Force rankings generation with current results immediately
      if (battleResults.length > 0) {
        generateRankings(battleResults);
        setShowingMilestone(true);
        
        toast({
          title: "Milestone Reached!",
          description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
        });
      }
      
      return true;  // Ensure it returns a boolean
    }
    
    return false;  // Ensure it returns a boolean
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
