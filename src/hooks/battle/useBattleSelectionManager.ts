import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleProcessor } from "./useBattleProcessor";

export const useBattleSelectionManager = (
  currentBattlePokemon: Pokemon[],
  battleType: BattleType,
  battleResults: any[],
  battlesCompleted: number,
  setBattleResults: React.Dispatch<any>,
  setBattlesCompleted: React.Dispatch<any>,
  allPokemon: Pokemon[],
  startNewBattle: (battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<any>,
  milestones: number[],
  generateRankings: (results: any[]) => void,
  setSelectedPokemon: React.Dispatch<any>
) => {
  const { processBattleResult } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    allPokemon,
    startNewBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon
  );

  const handleSelection = useCallback((selectedPokemonIds: number[]) => {
    console.log("⚫ useBattleSelectionManager: Pokémon selected, incrementing battle");
    const newResult = {
      winner: currentBattlePokemon.find(p => p.id === selectedPokemonIds[0])!,
      loser: currentBattlePokemon.find(p => p.id !== selectedPokemonIds[0])!
    };
    processBattleResult([newResult.winner.id, newResult.loser.id], currentBattlePokemon, battleType);
  }, [processBattleResult, currentBattlePokemon, battleType]);

  return { handleSelection };
};
