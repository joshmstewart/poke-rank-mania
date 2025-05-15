
import { useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";

/**
 * Main hook for processing battle results and managing progression
 */
export const useBattleProcessor = (
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: any[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Processing state using ref to avoid state updates during processing
  const isProcessingRef = useRef(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  // Use our smaller, focused hooks
  const { processResult } = useBattleResultProcessor(battleResults, setBattleResults);
  const { checkMilestone, incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );
  const { setupNextBattle } = useNextBattleHandler(allPokemon, startNewBattle, setSelectedPokemon);

  // Process the battle result
  const processBattleResult = useCallback((selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent processing if already in progress
    if (isProcessingRef.current) {
      console.log("useBattleProcessor: Already processing a battle result, ignoring");
      return;
    }
    
    console.log("useBattleProcessor: Processing battle result with selections:", selections);
    
    // Set processing flag
    isProcessingRef.current = true;
    setIsProcessingResult(true);
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("useBattleProcessor: No current battle data available");
      isProcessingRef.current = false;
      setIsProcessingResult(false);
      return;
    }

    try {
      // Process battle results using the specialized hook
      const newResults = processResult(selections, battleType, currentBattle);
      
      if (!newResults) {
        console.error("useBattleProcessor: Failed to process results");
        isProcessingRef.current = false;
        setIsProcessingResult(false);
        return;
      }
      
      // Update battle results
      setBattleResults(newResults);
      
      // Increment battles completed
      const newBattlesCompleted = incrementBattlesCompleted();
      console.log("useBattleProcessor: Battles completed incremented to", newBattlesCompleted);
      
      // Check if we've hit a milestone immediately
      const reachedMilestone = checkMilestone(newBattlesCompleted, newResults);
      console.log("useBattleProcessor: Milestone reached?", reachedMilestone);
      
      if (!reachedMilestone) {
        // Start a new battle if no milestone reached
        console.log("useBattleProcessor: Setting up next battle with battle type", battleType);
        setupNextBattle(battleType);
      }
      
      // Reset processing state after all operations are done
      isProcessingRef.current = false;
      setIsProcessingResult(false);
      console.log("useBattleProcessor: Processing state reset to false");
    } catch (error) {
      console.error("useBattleProcessor: Error processing battle:", error);
      toast({
        title: "Error",
        description: "Failed to process battle result",
        variant: "destructive"
      });
      isProcessingRef.current = false;
      setIsProcessingResult(false);
    }
  }, [
    processResult,
    setBattleResults,
    incrementBattlesCompleted,
    checkMilestone,
    setupNextBattle
  ]);

  return { processBattleResult, isProcessingResult };
};
