import { useState } from "react";

/**
 * Hook for managing battle progress state
 */
export const useProgressState = () => {
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  
  // Always use full ranking mode, but keep in localStorage for compatibility
  const fullRankingMode = true;
  localStorage.setItem('pokemon-ranker-full-ranking-mode', 'true');
  
  // Milestone triggers - show rankings at these battle counts
  // Add more frequent early milestones, then cap at showing every 50 battles
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];

  return {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones
  };
};
