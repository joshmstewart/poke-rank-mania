
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
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
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
  const { addResult: processBattleResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults
  );
  
  const processBattle = (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number // Added parameter for generation
  ) => {
    console.log("useBattleProcessor: Processing battle result with selections:", selectedPokemonIds);
    
    if (isProcessingResult) {
      console.log("Already processing a result, skipping");
      return;
    }
    
    setIsProcessingResult(true);
    
    // First, process the battle result
    processBattleResult(selectedPokemonIds, currentBattlePokemon, battleType);

    // Increment the battles completed counter
    incrementBattlesCompleted((newCount: number) => {
      console.log("useBattleProcessor: Battles completed incremented to", newCount);
      
      // Check if we've hit a milestone
      const hitMilestone = checkMilestone(newCount, battleResults);
      console.log("useBattleProcessor: Milestone reached?", hitMilestone);
      
      if (hitMilestone) {
        // When a milestone is hit, also save the rankings automatically
        saveRankings(
          // Generate fresh rankings from battle results
          Array.from(new Map(battleResults.map(result => {
            const winnerData = result.winner;
            return [winnerData.id, winnerData];
          })).values()),
          currentSelectedGeneration,
          "battle"
        );
      }
      
      // Setup the next battle
      console.log("useBattleProcessor: Setting up next battle with battle type", battleType);
      setupNextBattle(battleType);
      setIsProcessingResult(false);
    });
  };

  return {
    processBattleResult: processBattle,
    isProcessingResult
  };
};
