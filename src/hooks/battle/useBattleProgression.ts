
import { useCallback, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle battle progression and milestone checks
 */
export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: (value: boolean) => void,
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
  const checkMilestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const actionsInProgressRef = useRef(0);

  // Clean up any timeouts on unmount
  useEffect(() => {
    return () => {
      if (battleUpdateTimeoutRef.current) {
        clearTimeout(battleUpdateTimeoutRef.current);
      }
      if (checkMilestoneTimeoutRef.current) {
        clearTimeout(checkMilestoneTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to safely execute an async action
  const safeAsyncAction = useCallback(async (action: () => Promise<void>) => {
    actionsInProgressRef.current++;
    try {
      await action();
    } finally {
      actionsInProgressRef.current--;
    }
  }, []);

  // Helper function to check if a battle count is a milestone
  const checkIfMilestone = useCallback((battleCount: number): boolean => {
    // Prevent checking during processing
    if (processingMilestoneRef.current) {
      return false;
    }
    
    if (milestones.includes(battleCount)) {
      console.log(`Milestone detected for battle count: ${battleCount}`);
      return true;
    }
    
    // Every 50 battles after 100
    if (battleCount > 100 && battleCount % 50 === 0) {
      console.log(`50-battle milestone detected: ${battleCount}`);
      return true;
    }
    
    return false;
  }, [milestones]);

  // Check milestone with debounce protection
  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]) => {
    // Prevent checking during processing or if already shown
    if (processingMilestoneRef.current || 
        showingMilestoneRef.current || 
        newBattlesCompleted === lastMilestoneShownRef.current) {
      return false;
    }

    // Only check for milestone if battles were completed
    if (newBattlesCompleted <= 0) {
      return false;
    }

    const isExactMilestone = milestones.includes(newBattlesCompleted);
    const isEvery50Battles = newBattlesCompleted >= 100 && newBattlesCompleted % 50 === 0;

    if (isExactMilestone || isEvery50Battles) {
      // Set processing flag to prevent duplicate processing
      processingMilestoneRef.current = true;
      
      // Show toast first
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
      });
      
      // Update the last milestone shown
      lastMilestoneShownRef.current = newBattlesCompleted;

      if (Array.isArray(battleResults) && battleResults.length > 0) {
        try {
          // Generate rankings
          generateRankings(battleResults);
          
          // Set flag in ref first to track milestone state
          showingMilestoneRef.current = true;
          
          // Wait a moment before updating React state
          if (checkMilestoneTimeoutRef.current) {
            clearTimeout(checkMilestoneTimeoutRef.current);
          }
          
          // Use a sequence of timeouts to ensure state updates happen in order
          checkMilestoneTimeoutRef.current = setTimeout(() => {
            // Update the state - use a function form to ensure we're not depending on stale state
            setShowingMilestone(true);
            
            // Reset processing flag after everything is complete
            setTimeout(() => {
              processingMilestoneRef.current = false;
              checkMilestoneTimeoutRef.current = null;
            }, 200);
          }, 200);
        } catch (err) {
          console.error("Error generating rankings at milestone:", err);
          processingMilestoneRef.current = false;
          showingMilestoneRef.current = false;
        }
      } else {
        processingMilestoneRef.current = false;
      }

      return true;
    }

    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  const incrementBattlesCompleted = useCallback((battleResults: any[]) => {
    // Prevent multiple increments at the same time
    if (incrementInProgressRef.current) {
      console.log("Battle increment already in progress, skipping");
      return;
    }
    
    incrementInProgressRef.current = true;
    
    // Clear any existing timeout
    if (battleUpdateTimeoutRef.current) {
      clearTimeout(battleUpdateTimeoutRef.current);
    }
    
    // Use setTimeout to break the render cycle
    battleUpdateTimeoutRef.current = setTimeout(() => {
      // Use a function updater to avoid stale state
      setBattlesCompleted(prev => {
        const updated = prev + 1;
        pendingBattleUpdateRef.current = updated;
        
        // Check milestone with a delay to ensure state updates properly
        battleUpdateTimeoutRef.current = setTimeout(() => {
          if (!showingMilestoneRef.current) {
            checkMilestone(updated, battleResults);
          }
          
          // Reset flag after enough time has passed
          setTimeout(() => {
            incrementInProgressRef.current = false;
            battleUpdateTimeoutRef.current = null;
          }, 300);
        }, 200);
        
        return updated;
      });
    }, 100);
  }, [setBattlesCompleted, checkMilestone]);

  const resetMilestone = useCallback(() => {
    console.log("🧹 Resetting milestone flag");
    
    // Update refs first
    showingMilestoneRef.current = false;
    processingMilestoneRef.current = false;
    
    // Then update state with a delay to avoid render loops
    setTimeout(() => {
      setShowingMilestone(false);
    }, 100);
  }, [setShowingMilestone]);

  return {
    checkMilestone,
    incrementBattlesCompleted,
    isShowingMilestone: showingMilestoneRef.current,
    resetMilestone
  };
}, []);
