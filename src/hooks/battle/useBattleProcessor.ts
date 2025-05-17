
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";

export const useBattleProcessor = (
  battleResults: BattleResult,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: BattleResult) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  
  // Use battle progression hook for handling milestones
  const { checkMilestone, incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );
  
  // Use next battle handler hook for setting up the next battle
  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    startNewBattle,
    setSelectedPokemon
  );
  
  // Use the battle result processor for recording battle results
  const { processResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults
  );
  
  const processBattle = (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    console.log("useBattleProcessor: Processing battle result with selections:", selectedPokemonIds);
    
    if (isProcessingResult) {
      console.log("Already processing a result, skipping");
      return;
    }
    
    // Validate input parameters
    if (!selectedPokemonIds || selectedPokemonIds.length === 0) {
      console.error("useBattleProcessor: No selected Pokemon IDs provided");
      setIsProcessingResult(false);
      return;
    }

    if (!currentBattlePokemon || currentBattlePokemon.length < 2) {
      console.error("useBattleProcessor: Invalid battle Pokemon array:", currentBattlePokemon?.length || 0);
      setIsProcessingResult(false);
      return;
    }
    
    setIsProcessingResult(true);
    
    // First, process the battle result
    const newBattleResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

    // Only proceed if we got valid battle results
    if (newBattleResults) {
      // Update the battle results state
      setBattleResults(newBattleResults);
      
      // Increment the battles completed counter
      incrementBattlesCompleted((newCount: number) => {
        console.log("useBattleProcessor: Battles completed incremented to", newCount);
        
        // Check if we've hit a milestone
        const hitMilestone = checkMilestone(newCount, newBattleResults);
        console.log("useBattleProcessor: Milestone reached?", hitMilestone);
        
        if (hitMilestone && currentSelectedGeneration) {
          // When a milestone is hit, also save the rankings automatically
          // Update: Only save if we actually have battle results
          if (newBattleResults.length > 0) {
            saveRankings(
              // Generate fresh rankings from battle results
              Array.from(new Map(newBattleResults.map(result => {
                const winnerData = result.winner;
                return [winnerData.id, winnerData];
              })).values()),
              currentSelectedGeneration,
              "battle"
            );
          }
        }
        
        // Setup the next battle
        console.log("useBattleProcessor: Setting up next battle with battle type", battleType);
        setupNextBattle(battleType);
        setIsProcessingResult(false);
      });
    } else {
      console.error("useBattleProcessor: Failed to process battle result");
      setIsProcessingResult(false);
      
      // Setup the next battle anyway to prevent getting stuck
      setupNextBattle(battleType);
    }
  };

  return {
    processBattleResult: processBattle,
    isProcessingResult
  };
};
