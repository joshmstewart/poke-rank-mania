import { useCallback } from "react";
import { SingleBattle } from "./types";
import { useBattleProcessor } from "./useBattleProcessor";

export const useBattleSelectionManager = (
  battleResults: SingleBattle[],
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void
) => {

  const { processBattleResult } = useBattleProcessor(
    battleResults,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const handleSelection = useCallback((selectedPokemonIds: number[]) => {
    console.log("⚫ useBattleSelectionManager: Pokémon selected, incrementing battle");
    const newResult: SingleBattle = {
      winner: { id: selectedPokemonIds[0] },
      loser: { id: selectedPokemonIds[1] }
    };
    processBattleResult([newResult]);
  }, [processBattleResult]);

  return {
    handleSelection,
  };
};
