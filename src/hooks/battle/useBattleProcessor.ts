
import { useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

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
    if (isProcessingResult) return;
    setIsProcessingResult(true);

    try {
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);
      if (newResults.length > 0) {
        const cumulativeResults = [...battleResults, ...newResults];
        setBattleResults(cumulativeResults);
        
        console.log("🟡 useBattleProcessor: incremented battles completed");
        incrementBattlesCompleted(newResults);

        const updatedCount = battlesCompleted + newResults.length;
        
        // Check for milestone and show toast if needed
        if (milestones.includes(updatedCount) && !processedMilestonesRef.current.has(updatedCount)) {
          processedMilestonesRef.current.add(updatedCount);
          
          // Save the rankings
          saveRankings(
            Array.from(new Map(cumulativeResults.map(result => [result.winner.id, result.winner])).values()),
            currentSelectedGeneration,
            "battle"
          );
          
          // Generate rankings at milestone
          generateRankings(cumulativeResults);
          
          // Show toast notification
          toast({
            title: "Milestone Reached!",
            description: `You've completed ${updatedCount} battles. Rankings have been updated.`,
            duration: 5000
          });
        }

        await setupNextBattle(battleType);
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
    generateRankings
  ]);

  return { processBattleResult: processBattle, isProcessingResult };
};
