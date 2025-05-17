
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
  generateRankings: (results: any[]) => void,
) => {
  // Add a ref to track if a milestone is currently being shown
  const showingMilestoneRef = useRef(false);
  
  // Reset showingMilestone state when battles completed changes
  useEffect(() => {
    // Check if we're at a milestone
    const isExactMilestone = milestones.includes(battlesCompleted);
    const isEvery50Battles = battlesCompleted >= 100 && battlesCompleted % 50 === 0;
    
    if (isExactMilestone || isEvery50Battles) {
      console.log(`useEffect in useBattleProgression: Milestone at ${battlesCompleted} battles - setting milestone flag`);
      showingMilestoneRef.current = true;
      setShowingMilestone(true);
    }
  }, [battlesCompleted, milestones, setShowingMilestone]);
  
  // Check if we've hit a milestone
  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]) => {
    // Determine if we should show milestone
    // 1. Check if exactly on a milestone number
    const isExactMilestone = milestones.includes(newBattlesCompleted);
    
    // 2. Check if we've gone 50 battles since last milestone (after 100)
    const isEvery50Battles = newBattlesCompleted >= 100 && newBattlesCompleted % 50 === 0;
    
    if (isExactMilestone || isEvery50Battles) {
      console.log(`useBattleProgression: Milestone reached at ${newBattlesCompleted} battles`);
      
      // Set the milestone flag
      showingMilestoneRef.current = true;
      
      // Ensure we have battle results before generating rankings
      if (Array.isArray(battleResults) && battleResults.length > 0) {
        console.log(`Generating rankings at milestone ${newBattlesCompleted} with ${battleResults.length} results`);
        
        // FORCE rankings generation with current results
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
        console.warn("Cannot generate rankings at milestone - no battle results available");
      }
      
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
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone: useCallback(() => {
      showingMilestoneRef.current = false;
      setShowingMilestone(false);
    }, [setShowingMilestone])
  };
};
