
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
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const processingRef = useRef(false);

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
    console.log("useBattleProcessor: Processing battle result with selections:", selections);
    
    // Prevent duplicate processing
    if (processingRef.current) {
      console.log("useBattleProcessor: Already processing a result, skipping");
      return;
    }
    
    // Set processing flags
    setIsProcessingResult(true);
    processingRef.current = true;
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("useBattleProcessor: No current battle data available");
      setIsProcessingResult(false);
      processingRef.current = false;
      return;
    }

    try {
      // Process battle results using the specialized hook
      const newResults = processResult(selections, battleType, currentBattle);
      
      if (!newResults) {
        console.error("useBattleProcessor: Failed to process results");
        setIsProcessingResult(false);
        processingRef.current = false;
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
        // Force a small delay to make sure UI is updated properly
        setTimeout(() => {
          setupNextBattle(battleType);
          // Reset processing flags after completion
          setIsProcessingResult(false);
          processingRef.current = false;
        }, 50);
      } else {
        // Reset processing flags
        setIsProcessingResult(false);
        processingRef.current = false;
      }
    } catch (error) {
      console.error("useBattleProcessor: Error processing battle:", error);
      toast({
        title: "Error",
        description: "Failed to process battle result",
        variant: "destructive"
      });
      setIsProcessingResult(false);
      processingRef.current = false;
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
