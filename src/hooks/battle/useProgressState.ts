
import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook for managing battle progress state
 */
export const useProgressState = () => {
  // Use refs to track real state to prevent re-render loops
  const milestoneRef = useRef(false);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const updatingMilestoneRef = useRef(false); // Ref to track updates in progress
  const setMilestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveUpdatesRef = useRef(0);
  const requestedMilestoneShowRef = useRef(false);
  
  // Sync state with refs on mount and when state changes
  useEffect(() => {
    milestoneRef.current = showingMilestone;
  }, [showingMilestone]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (setMilestoneTimeoutRef.current) {
        clearTimeout(setMilestoneTimeoutRef.current);
        setMilestoneTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Wrap the setShowingMilestone to update both state and ref with guards
  const safeSetShowingMilestone = useCallback((value: boolean) => {
    // Skip update if value hasn't changed
    if (milestoneRef.current === value) {
      console.log(`Milestone value ${value} already set, skipping update`);
      return;
    }
    
    // Skip if we're already updating
    if (updatingMilestoneRef.current) {
      console.log(`Already updating milestone to ${value}, skipping redundant update`);
      return;
    }
    
    // Protection against multiple rapid updates
    consecutiveUpdatesRef.current++;
    const currentUpdateCounter = consecutiveUpdatesRef.current;
    
    console.log(`Setting milestone to ${value} (was ${milestoneRef.current})`);
    
    // Set updating flag to prevent concurrent updates
    updatingMilestoneRef.current = true;
    
    // Update ref first
    milestoneRef.current = value;
    requestedMilestoneShowRef.current = value;
    
    // Cancel any pending timeout to prevent race conditions
    if (setMilestoneTimeoutRef.current) {
      clearTimeout(setMilestoneTimeoutRef.current);
    }
    
    // Then update state with a small delay to avoid render loops
    setMilestoneTimeoutRef.current = setTimeout(() => {
      // Only proceed if this is still the most recent update request
      if (currentUpdateCounter === consecutiveUpdatesRef.current) {
        setShowingMilestone(value);
        
        // Reset updating flag after a short delay
        setTimeout(() => {
          if (currentUpdateCounter === consecutiveUpdatesRef.current) {
            updatingMilestoneRef.current = false;
          }
        }, 100);
      } else {
        // If not the most recent update, just release the lock
        updatingMilestoneRef.current = false;
      }
      
      setMilestoneTimeoutRef.current = null;
    }, value ? 20 : 100); // Show faster, hide slower
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
