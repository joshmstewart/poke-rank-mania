import { useState, useRef } from "react";

/**
 * Hook for managing battle progress state
 */
export const useProgressState = () => {
  // Use refs to track real state to prevent re-render loops
  const milestoneRef = useRef(false);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  
  // Wrap the setShowingMilestone to update both state and ref
  const safeSetShowingMilestone = (value: boolean) => {
    // Only update if the value actually changed to prevent needless rerenders
    if (milestoneRef.current !== value) {
      // Update ref first
      milestoneRef.current = value;
      // Then update state with a small delay to avoid render loops
      setTimeout(() => {
        setShowingMilestone(value);
      }, 0);
    }
  };
  
  // Always use full ranking mode, but keep in localStorage for compatibility
  const fullRankingMode = true;
  localStorage.setItem('pokemon-ranker-full-ranking-mode', 'true');
  
  // Milestone triggers - show rankings at these battle counts
  // Add more frequent early milestones, then cap at showing every 50 battles
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
