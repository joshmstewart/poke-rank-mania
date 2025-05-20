
import { useCallback, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle battle progression and milestone checks
 */
export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: (value: boolean) => void, // Changed to accept our custom setter
  milestones: number[],
  generateRankings: (results: any[]) => void
) => {
  // Refs to track state without causing renders
  const showingMilestoneRef = useRef(false);
  const lastMilestoneShownRef = useRef(-1);
  const processingMilestoneRef = useRef(false);
  const incrementInProgressRef = useRef(false);
  const pendingBattleUpdateRef = useRef(0);
  const battleUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any timeouts on unmount
  useEffect(() => {
    return () => {
      if (battleUpdateTimeoutRef.current) {
        clearTimeout(battleUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to check if a battle count is a milestone
  const checkIfMilestone = useCallback((battleCount: number): boolean => {
    // Prevent checking during processing
    if (processingMilestoneRef.current) {
      return false;
    }
    
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
          
          // Show toast first
          toast({
            title: "Milestone Reached!",
            description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
          });
          
          // Update state after a delay to prevent render loops
          setTimeout(() => {
            // Only update if still the current milestone
            if (lastMilestoneShownRef.current === newBattlesCompleted) {
              // Update the milestone state
              setShowingMilestone(true);
              
              // Reset processing flag after everything is complete
              setTimeout(() => {
                processingMilestoneRef.current = false;
              }, 300);
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
    
    // Clear any existing timeout
    if (battleUpdateTimeoutRef.current) {
      clearTimeout(battleUpdateTimeoutRef.current);
    }
    
    // Use setTimeout to break the render cycle
    battleUpdateTimeoutRef.current = setTimeout(() => {
      setBattlesCompleted(prev => {
        const updated = prev + 1;
        pendingBattleUpdateRef.current = updated;
        
        // Don't check milestone immediately to avoid render loop
        battleUpdateTimeoutRef.current = setTimeout(() => {
          if (!showingMilestoneRef.current) {
            checkMilestone(updated, battleResults);
          }
          incrementInProgressRef.current = false;
          battleUpdateTimeoutRef.current = null;
        }, 100);
        
        return updated;
      });
    }, 50);
  }, [setBattlesCompleted, checkMilestone]);

  const resetMilestone = useCallback(() => {
    console.log("🧹 Resetting milestone flag");
    
    // Update refs first
    showingMilestoneRef.current = false;
    processingMilestoneRef.current = false;
    
    // Then update state with a delay to avoid render loops
    setTimeout(() => {
      setShowingMilestone(false);
    }, 50);
  }, [setShowingMilestone]);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone
  };
};
