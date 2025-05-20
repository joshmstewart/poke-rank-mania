import { useState, useCallback } from "react";
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
  startNewBattle: (battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  const { checkMilestone, incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    startNewBattle,
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults
  );

  const processBattle = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult) return;

    setIsProcessingResult(true);

    const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

    if (newResults.length > 0) {
      const cumulativeResults = [...battleResults, ...newResults];

      setBattleResults(cumulativeResults);
      incrementBattlesCompleted(newResults);

      const updatedCount = battlesCompleted + newResults.length;

      const hitMilestone = checkMilestone(updatedCount, cumulativeResults);
      if (hitMilestone && currentSelectedGeneration) {
        saveRankings(
          Array.from(new Map(
            cumulativeResults.map(result => [result.winner.id, result.winner])
          ).values()),
          currentSelectedGeneration,
          "battle"
        );
      }

      setupNextBattle(battleType);
    }

    setIsProcessingResult(false);
  }, [
    isProcessingResult,
    battleResults,
    battlesCompleted,
    processResult,
    setBattleResults,
    incrementBattlesCompleted,
    checkMilestone,
    setupNextBattle
  ]);

  return {
    processBattleResult: processBattle,
    isProcessingResult
  };
};
