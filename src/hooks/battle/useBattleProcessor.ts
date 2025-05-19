
import { useState } from "react";
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

    if (!selectedPokemonIds || selectedPokemonIds.length === 0) {
      console.error("No selected Pokémon provided");
      return;
    }

    if (!currentBattlePokemon || currentBattlePokemon.length < 2) {
      console.error("Invalid currentBattlePokemon array");
      return;
    }

    setIsProcessingResult(true);

    const newResults: SingleBattle[] = processResult(
      selectedPokemonIds,
      battleType,
      currentBattlePokemon
    );

    if (newResults && newResults.length > 0) {
      setBattleResults(prev => [...prev, ...newResults]);

      incrementBattlesCompleted((newCount: number) => {
        console.log("Battles completed incremented to", newCount);

        const hitMilestone = checkMilestone(newCount, newResults);
        console.log("Milestone hit?", hitMilestone);

        if (hitMilestone && currentSelectedGeneration) {
          saveRankings(
            Array.from(
              new Map(
                newResults.map(result => [result.winner.id, result.winner])
              ).values()
            ),
            currentSelectedGeneration,
            "battle"
          );
        }

        setupNextBattle(battleType);
        setIsProcessingResult(false);
      });
    } else {
      console.error("No results returned from processResult");
      setupNextBattle(battleType);
      setIsProcessingResult(false);
    }
  };

  return {
    processBattleResult: processBattle,
    isProcessingResult
  };
};
