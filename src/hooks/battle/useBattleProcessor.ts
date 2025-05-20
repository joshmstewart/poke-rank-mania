
import { useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";

export const useBattleProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const processedMilestonesRef = useRef<Set<number>>(new Set());
  const milestoneInProgressRef = useRef(false);

  const { incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    (battleType: BattleType) => {
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const battleSize = battleType === "triplets" ? 3 : 2;
      setCurrentBattle(shuffled.slice(0, battleSize));
      setSelectedPokemon([]);
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(battleResults, setBattleResults);

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult || milestoneInProgressRef.current) return;
    setIsProcessingResult(true);

    try {
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);
      if (newResults.length > 0) {
        const cumulativeResults = [...battleResults, ...newResults];
        setBattleResults(cumulativeResults);
        
        console.log("🟡 useBattleProcessor: incremented battles completed");
        incrementBattlesCompleted(cumulativeResults);

        // Calculate updated count directly to prevent race conditions
        const updatedCount = battlesCompleted + newResults.length;
        
        // Check for milestone and handle UI accordingly
        if (milestones.includes(updatedCount) && !processedMilestonesRef.current.has(updatedCount)) {
          // Flag that we're processing a milestone to prevent duplicate processing
          milestoneInProgressRef.current = true;
          processedMilestonesRef.current.add(updatedCount);
          console.log(`🎉 Milestone reached: ${updatedCount} battles`);
          
          // Save the rankings
          saveRankings(
            Array.from(new Map(cumulativeResults.map(result => [result.winner.id, result.winner])).values()),
            currentSelectedGeneration,
            "battle"
          );
          
          // Generate rankings for the milestone
          generateRankings(cumulativeResults);
          
          // Show milestone view
          setShowingMilestone(true);
          
          // Important: Do not reset milestoneInProgressRef.current flag here
          // It will be reset when the user continues or starts a new battle set
          return;
        }

        // Only setup next battle if we're not showing a milestone
        if (!milestoneInProgressRef.current) {
          await setupNextBattle(battleType);
        }
      }
    } finally {
      setIsProcessingResult(false);
    }
  }, [
    isProcessingResult, 
    processResult, 
    battleResults, 
    setBattleResults, 
    incrementBattlesCompleted, 
    battlesCompleted, 
    milestones, 
    setupNextBattle,
    generateRankings,
    setShowingMilestone
  ]);

  return { 
    processBattleResult: processBattle, 
    isProcessingResult,
    resetMilestoneInProgress: () => {
      milestoneInProgressRef.current = false;
    }
  };
};
