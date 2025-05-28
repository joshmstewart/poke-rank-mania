
import { useCallback, useRef, useEffect } from "react";

export const useBattleProgressionReset = (
  setShowingMilestone: (value: boolean) => void,
  battleGenerationBlockedRef: React.MutableRefObject<boolean>
) => {
  const showingMilestoneRef = useRef(false);
  const milestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
    };
  }, []);

  const resetMilestone = useCallback(() => {
    console.log("🔄 Resetting milestone state in useBattleProgression");
    showingMilestoneRef.current = false;
    setShowingMilestone(false);
    
    // CRITICAL FIX: Much shorter delay to prevent auto-trigger conflicts
    setTimeout(() => {
      battleGenerationBlockedRef.current = false;
      console.log("✅ MILESTONE: Battle generation UNBLOCKED after milestone dismissal (REDUCED delay)");
      
      // Dispatch event to signal it's safe to generate new battles
      const unblockEvent = new CustomEvent('milestone-unblocked', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(unblockEvent);
    }, 400); // Reduced from 1500ms to 400ms
    
    console.log("✅ useBattleProgression: milestone tracking state reset");
  }, [setShowingMilestone, battleGenerationBlockedRef]);

  return {
    resetMilestone,
    showingMilestoneRef
  };
};
