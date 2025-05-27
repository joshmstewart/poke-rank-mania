
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
  
  // CRITICAL FIX: Enhanced milestone state setter with proper sequencing
  const setShowingMilestoneEnhanced = useCallback((show: boolean) => {
    console.log(`🔄 useProgressState: Setting showingMilestone to ${show}`);
    setShowingMilestone(show);
    
    if (show) {
      setMilestoneInProgress(true);
    } else {
      // CRITICAL FIX: Delay clearing milestone state to prevent battle flashing
      setTimeout(() => {
        setMilestoneInProgress(false);
        
        // Dispatch event with proper sequencing info
        const dismissEvent = new CustomEvent('milestone-dismissed', {
          detail: { timestamp: Date.now(), forced: false, immediate: false }
        });
        document.dispatchEvent(dismissEvent);
        
        console.log("🏆 useProgressState: Milestone dismissed with proper sequencing");
      }, 200); // Small delay to ensure UI updates properly
    }
  }, []);
  
  // CRITICAL FIX: Force dismiss with immediate flag for urgent dismissals
  const forceDismissMilestone = useCallback(() => {
    console.log("🔄 useProgressState: Force dismissing milestone immediately");
    
    // Clear state synchronously for immediate dismissals
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    
    // Dispatch immediate dismissal event
    const dismissEvent = new CustomEvent('milestone-dismissed', {
      detail: { forced: true, timestamp: Date.now(), immediate: true }
    });
    document.dispatchEvent(dismissEvent);
    
    console.log("🏆 useProgressState: Milestone force dismissed immediately");
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
