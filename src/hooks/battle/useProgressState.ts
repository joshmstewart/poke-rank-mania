
import { useState, useCallback } from "react";

export const useProgressState = () => {
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [fullRankingMode, setFullRankingMode] = useState(false);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  
  // More frequent early milestones, spaced out later
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  
  // Function to reset milestone in progress state
  const resetMilestoneInProgress = useCallback(() => {
    console.log("🔄 useProgressState: Resetting milestone in progress state");
    setMilestoneInProgress(false);
  }, []);
  
  // Enhanced milestone state setter with proper event handling
  const setShowingMilestoneEnhanced = useCallback((show: boolean) => {
    console.log(`🔄 useProgressState: Setting showingMilestone to ${show}`);
    setShowingMilestone(show);
    
    if (show) {
      setMilestoneInProgress(true);
    } else {
      // When hiding milestone, reset milestone in progress immediately
      setMilestoneInProgress(false);
      
      // Dispatch a custom event to notify other components
      const dismissEvent = new CustomEvent('milestone-dismissed', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(dismissEvent);
      
      console.log("🏆 useProgressState: Milestone dismissed, dispatched milestone-dismissed event");
    }
  }, []);
  
  // Function to force dismiss milestone (for button clicks)
  const forceDismissMilestone = useCallback(() => {
    console.log("🔄 useProgressState: Force dismissing milestone");
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    
    // Dispatch immediate dismissal event
    const dismissEvent = new CustomEvent('milestone-dismissed', {
      detail: { forced: true, timestamp: Date.now() }
    });
    document.dispatchEvent(dismissEvent);
    
    console.log("🏆 useProgressState: Milestone force dismissed");
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
    resetMilestoneInProgress,
    forceDismissMilestone
  };
};
