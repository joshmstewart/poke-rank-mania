import { useState, useRef } from "react";

/**
 * Hook for managing battle progress state
 */
export const useProgressState = () => {
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  
  // Use refs to avoid redundant state updates
  const milestoneRef = useRef(false);
  
  // Wrap the setShowingMilestone to update both state and ref
  const safeSetShowingMilestone = (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(milestoneRef.current) : value;
    
    // Only update if the value actually changed
    if (newValue !== milestoneRef.current) {
      milestoneRef.current = newValue;
      setShowingMilestone(newValue);
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
