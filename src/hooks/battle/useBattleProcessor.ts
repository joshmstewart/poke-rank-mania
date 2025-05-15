
import { useState, useCallback } from "react";
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
    
    // Set processing flag
    setIsProcessingResult(true);
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("useBattleProcessor: No current battle data available");
      setIsProcessingResult(false);
      return;
    }

    try {
      // Process battle results using the specialized hook
      const newResults = processResult(selections, battleType, currentBattle);
      
      if (!newResults) {
        console.error("useBattleProcessor: Failed to process results");
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
      setIsProcessingResult(false);
    } catch (error) {
      console.error("useBattleProcessor: Error processing battle:", error);
      toast({
        title: "Error",
        description: "Failed to process battle result",
        variant: "destructive"
      });
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
