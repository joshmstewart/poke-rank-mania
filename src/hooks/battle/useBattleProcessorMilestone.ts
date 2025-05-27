
import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { saveRankings } from "@/services/pokemon";

export const useBattleProcessorMilestone = (
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: any[]) => void,
  allPokemon: Pokemon[]
) => {
  const milestoneInProgressRef = useRef(false);

  const handleMilestone = useCallback((
    milestone: number,
    updatedResults: any[],
    currentSelectedGeneration: number,
    timestamp: string
  ) => {
    milestoneInProgressRef.current = true;
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Set milestoneInProgressRef = true for milestone ${milestone}`);
    
    // CRITICAL FIX: Disable auto-triggers immediately when milestone is hit
    const disableAutoTriggerEvent = new CustomEvent('milestone-blocking', {
      detail: { 
        milestone, 
        timestamp: Date.now(),
        source: 'useBattleProcessor'
      }
    });
    document.dispatchEvent(disableAutoTriggerEvent);
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Dispatched milestone-blocking event`);
    
    saveRankings(allPokemon, currentSelectedGeneration, "battle");
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Rankings saved for generation ${currentSelectedGeneration}`);
    
    generateRankings(updatedResults);
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Rankings generated`);
  }, [setShowingMilestone, generateRankings, allPokemon]);

  const resetMilestoneInProgress = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] MILESTONE RESET: Setting milestoneInProgressRef to false`);
    milestoneInProgressRef.current = false;
  }, []);

  return {
    milestoneInProgressRef,
    handleMilestone,
    resetMilestoneInProgress
  };
};
