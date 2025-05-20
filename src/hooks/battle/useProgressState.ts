
import { useState, useRef, useCallback } from "react";

/**
 * Hook for managing battle progress state
 */
export const useProgressState = () => {
  // Use refs to track real state to prevent re-render loops
  const milestoneRef = useRef(false);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const updatingMilestoneRef = useRef(false); // New ref to track updates in progress
  
  // Wrap the setShowingMilestone to update both state and ref
  const safeSetShowingMilestone = useCallback((value: boolean) => {
    // Only update if the value actually changed to prevent needless rerenders
    // AND we're not already in the middle of an update
    if (milestoneRef.current !== value && !updatingMilestoneRef.current) {
      // Set updating flag to prevent concurrent updates
      updatingMilestoneRef.current = true;
      
      // Update ref first
      milestoneRef.current = value;
      
      // Then update state with a small delay to avoid render loops
      setTimeout(() => {
        setShowingMilestone(value);
        
        // Reset updating flag after a short delay
        setTimeout(() => {
          updatingMilestoneRef.current = false;
        }, 50);
      }, value ? 10 : 100); // Show faster, hide slower
    }
  }, []);
  
  // Always use full ranking mode, but keep in localStorage for compatibility
  const fullRankingMode = true;
  localStorage.setItem('pokemon-ranker-full-ranking-mode', 'true');
  
  // Milestone triggers - show rankings at these battle counts
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300];

  return {
    showingMilestone,
    setShowingMilestone: safeSetShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones,
    milestoneRef
  };
};
