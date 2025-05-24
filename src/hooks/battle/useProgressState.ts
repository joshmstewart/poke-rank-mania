
import { useState, useCallback } from "react";

export const useProgressState = () => {
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [fullRankingMode, setFullRankingMode] = useState(false);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  
  // More frequent early milestones, spaced out later
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  
  // Add a function to reset milestone in progress state
  const resetMilestoneInProgress = useCallback(() => {
    console.log("🔄 useProgressState: Resetting milestone in progress state");
    setMilestoneInProgress(false);
  }, []);
  
  // Enhanced milestone state setter with logging
  const setShowingMilestoneEnhanced = useCallback((show: boolean) => {
    console.log(`🔄 useProgressState: Setting showingMilestone to ${show}`);
    setShowingMilestone(show);
    
    // When showing milestone, set milestone in progress
    if (show) {
      setMilestoneInProgress(true);
    } else {
      // When hiding milestone, reset milestone in progress after a delay 
      // to allow for any pending operations to complete
      setTimeout(() => {
        setMilestoneInProgress(false);
      }, 500);
    }
  }, []);
  
  return {
    showingMilestone,
    setShowingMilestone: setShowingMilestoneEnhanced,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    setFullRankingMode,
    milestones,
    milestoneInProgress,
    resetMilestoneInProgress
  };
};
