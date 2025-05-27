
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
  
  // CRITICAL FIX: Enhanced milestone dismissal with immediate auto-trigger re-enablement
  const setShowingMilestoneEnhanced = useCallback((show: boolean) => {
    console.log(`🔄 useProgressState: Setting showingMilestone to ${show}`);
    setShowingMilestone(show);
    
    if (show) {
      setMilestoneInProgress(true);
      console.log("🚫 MILESTONE: Blocking new battle generation during milestone display");
    } else {
      console.log("🔄 MILESTONE: Dismissing milestone and immediately re-enabling auto-triggers");
      
      // CRITICAL FIX: Immediately send re-enablement event
      const reenableEvent = new CustomEvent('milestone-unblocked', {
        detail: { 
          timestamp: Date.now(),
          immediate: true
        }
      });
      document.dispatchEvent(reenableEvent);
      
      setTimeout(() => {
        setMilestoneInProgress(false);
        console.log("✅ MILESTONE: Milestone dismissed, system ready for new battles");
      }, 100);
    }
  }, []);
  
  // CRITICAL FIX: Force dismiss with immediate re-enablement
  const forceDismissMilestone = useCallback(() => {
    console.log("🔄 useProgressState: Force dismissing milestone with immediate re-enablement");
    
    // Clear state immediately
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    
    // CRITICAL FIX: Immediately re-enable auto-triggers
    const reenableEvent = new CustomEvent('milestone-unblocked', {
      detail: { 
        forced: true, 
        timestamp: Date.now(), 
        immediate: true
      }
    });
    document.dispatchEvent(reenableEvent);
    
    console.log("🏆 useProgressState: Milestone force dismissed with immediate re-enablement");
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
