
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
  
  // CRITICAL FIX: Enhanced milestone dismissal with proper coordination
  const setShowingMilestoneEnhanced = useCallback((show: boolean) => {
    console.log(`🔄 useProgressState: Setting showingMilestone to ${show}`);
    setShowingMilestone(show);
    
    if (show) {
      setMilestoneInProgress(true);
      console.log("🚫 MILESTONE: Blocking new battle generation during milestone display");
    } else {
      console.log("🔄 MILESTONE: Preparing to dismiss milestone with coordination");
      
      setTimeout(() => {
        setMilestoneInProgress(false);
        console.log("✅ MILESTONE: Milestone dismissed, coordinating with battle system");
        
        // CRITICAL FIX: Send coordinated dismissal event
        const dismissEvent = new CustomEvent('milestone-dismissed', {
          detail: { 
            timestamp: Date.now(), 
            forced: false, 
            immediate: false,
            coordinateWithBattleSystem: true // CRITICAL: This triggers auto-trigger prevention
          }
        });
        document.dispatchEvent(dismissEvent);
        
        console.log("🏆 useProgressState: Milestone dismissed with battle system coordination");
      }, 300);
    }
  }, []);
  
  // CRITICAL FIX: Force dismiss with immediate coordination but still prevent auto-triggers
  const forceDismissMilestone = useCallback(() => {
    console.log("🔄 useProgressState: Force dismissing milestone with immediate coordination");
    
    // Clear state immediately for urgent dismissals
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    
    // CRITICAL FIX: Immediate dismissal with coordination - STILL prevents auto-triggers
    const dismissEvent = new CustomEvent('milestone-dismissed', {
      detail: { 
        forced: true, 
        timestamp: Date.now(), 
        immediate: true,
        coordinateWithBattleSystem: true // CRITICAL: Still coordinate to prevent auto-triggers
      }
    });
    document.dispatchEvent(dismissEvent);
    
    console.log("🏆 useProgressState: Milestone force dismissed with coordination");
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
