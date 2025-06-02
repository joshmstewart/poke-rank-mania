
import { useCallback } from "react";

export const useMilestoneHandlers = (
  battlesCompleted: number,
  generateRankings: () => void,
  setShowingMilestone: (showing: boolean) => void,
  setMilestoneInProgress: (inProgress: boolean) => void,
  setRankingGenerated: (generated: boolean) => void,
  startNewBattleWrapper: () => void
) => {
  const handleSaveRankings = useCallback(() => {
    console.log(`🔧 [MILESTONE_SAVE_DEBUG] Saving rankings and hiding milestone`);
    setShowingMilestone(false);
  }, [setShowingMilestone]);

  const handleContinueBattles = useCallback(() => {
    console.log(`🔧 [MILESTONE_CONTINUE_DEBUG] ===== CONTINUING BATTLES =====`);
    console.log(`🔧 [MILESTONE_CONTINUE_DEBUG] Hiding milestone and starting new battle`);
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    startNewBattleWrapper();
    console.log(`🔧 [MILESTONE_CONTINUE_DEBUG] ===== END CONTINUE BATTLES =====`);
  }, [startNewBattleWrapper, setShowingMilestone, setMilestoneInProgress]);

  const resetMilestoneInProgress = useCallback(() => {
    console.log(`🔧 [MILESTONE_RESET_DEBUG] Resetting milestone in progress flag`);
    setMilestoneInProgress(false);
  }, [setMilestoneInProgress]);

  // CRITICAL FIX: Enhanced method to manually trigger milestone view with immediate effect
  const triggerMilestoneView = useCallback((battleCount: number) => {
    console.log(`🎯 [MANUAL_MILESTONE_TRIGGER] Manually triggering milestone view for ${battleCount} battles`);
    
    // Generate current rankings first
    generateRankings();
    
    // Set milestone flags immediately
    setMilestoneInProgress(true);
    setShowingMilestone(true);
    setRankingGenerated(true);
    
    console.log(`✅ [MANUAL_MILESTONE_TRIGGER] Milestone view triggered successfully for ${battleCount} battles`);
  }, [generateRankings, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // CRITICAL FIX: Method to force trigger milestone if it was missed
  const forceTriggerMilestone = useCallback(() => {
    console.log(`🚨 [FORCE_MILESTONE_TRIGGER] Forcing milestone trigger for ${battlesCompleted} battles`);
    triggerMilestoneView(battlesCompleted);
  }, [battlesCompleted, triggerMilestoneView]);

  // CRITICAL FIX: Method to manually trigger milestone view for battle 25 specifically
  const triggerMilestone25 = useCallback(() => {
    console.log(`🎯 [MILESTONE_25_TRIGGER] Manually triggering milestone view for battle 25`);
    
    // Force generate rankings
    generateRankings();
    
    // Set all milestone flags
    setMilestoneInProgress(true);
    setShowingMilestone(true);
    setRankingGenerated(true);
    
    console.log(`✅ [MILESTONE_25_TRIGGER] Battle 25 milestone view triggered successfully`);
  }, [generateRankings, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  return {
    handleSaveRankings,
    handleContinueBattles,
    resetMilestoneInProgress,
    triggerMilestoneView,
    forceTriggerMilestone,
    triggerMilestone25
  };
};
