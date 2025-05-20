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
  const processingMilestoneRef = useRef(false);
  const incrementInProgressRef = useRef(false);
  const pendingBattleUpdateRef = useRef(0);

  // Update ref when prop changes to keep it in sync
  useEffect(() => {
    showingMilestoneRef.current = false;
  }, [battlesCompleted]);

  // Helper function to check if a battle count is a milestone
  const checkIfMilestone = useCallback((battleCount: number): boolean => {
    // Check common milestones: 10, 25, 50, 100, etc.
    const commonMilestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
    
    // Exact milestone match
    if (commonMilestones.includes(battleCount)) {
      console.log(`Milestone detected for battle count: ${battleCount}`);
      return true;
    }
    
    // Every 50 battles after 100
    if (battleCount > 100 && battleCount % 50 === 0) {
      console.log(`50-battle milestone detected: ${battleCount}`);
      return true;
    }
    
    return false;
  }, []);

  // Actively invoked after battle result - but with debounce to prevent multiple calls
  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]) => {
    // Prevent checking during processing or if already shown
    if (processingMilestoneRef.current || 
        newBattlesCompleted === lastMilestoneShownRef.current || 
        showingMilestoneRef.current) {
      return false;
    }

    const isExactMilestone = milestones.includes(newBattlesCompleted);
    const isEvery50Battles = newBattlesCompleted >= 100 && newBattlesCompleted % 50 === 0;

    if (isExactMilestone || isEvery50Battles) {
      console.log(`🔔 checkMilestone triggered at ${newBattlesCompleted}`);

      // Set processing flag to prevent duplicate processing
      processingMilestoneRef.current = true;
      
      // Update the last milestone shown
      lastMilestoneShownRef.current = newBattlesCompleted;

      if (Array.isArray(battleResults) && battleResults.length > 0) {
        try {
          // Generate rankings but don't update UI state yet
          generateRankings(battleResults);
          
          // Set flag in ref first
          showingMilestoneRef.current = true;
          
          // Defer state update to avoid render loops
          setTimeout(() => {
            // Only update if we're still the current milestone
            if (lastMilestoneShownRef.current === newBattlesCompleted) {
              setShowingMilestone(true);
              
              // Reset processing flag after a delay to allow state to settle
              setTimeout(() => {
                processingMilestoneRef.current = false;
              }, 200);
              
              toast({
                title: "Milestone Reached!",
                description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
              });
            } else {
              processingMilestoneRef.current = false;
            }
          }, 100);
        } catch (err) {
          console.error("Error generating rankings at milestone:", err);
          processingMilestoneRef.current = false;
        }
      } else {
        console.warn("No battle results to generate rankings");
        processingMilestoneRef.current = false;
      }

      return true;
    }

    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const incrementBattlesCompleted = useCallback((battleResults: any[]) => {
    // Prevent multiple increments at the same time
    if (incrementInProgressRef.current) {
      return;
    }
    
    incrementInProgressRef.current = true;
    
    // Use setTimeout to break the render cycle
    setTimeout(() => {
      setBattlesCompleted(prev => {
        const updated = prev + 1;
        pendingBattleUpdateRef.current = updated;
        
        // Defer milestone check to avoid render during render
        setTimeout(() => {
          if (!showingMilestoneRef.current) {
            checkMilestone(updated, battleResults);
          }
          incrementInProgressRef.current = false;
        }, 50);
        
        return updated;
      });
    }, 0);
  }, [setBattlesCompleted, checkMilestone]);

  const resetMilestone = useCallback(() => {
    console.log("🧹 Resetting milestone flag");
    showingMilestoneRef.current = false;
    processingMilestoneRef.current = false;
    
    // Use setTimeout to break potential render cycles
    setTimeout(() => {
      setShowingMilestone(false);
    }, 0);
  }, [setShowingMilestone]);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone
  };
};
