
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleManager = (
  currentBattlePokemon: Pokemon[],
  battleType: BattleType,
  battleResults: SingleBattle[],
  battlesCompleted: number,
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType) => void,
  initialSelectedPokemon: number[] = []
) => {
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>(initialSelectedPokemon);

  const handlePokemonSelect = (pokemonId: number) => {
    setSelectedPokemon((prevSelected) => {
      const updatedSelection = [...prevSelected, pokemonId];
      processBattleResult(updatedSelection, currentBattlePokemon, battleType);
      return updatedSelection;
    });
  };

  const handleTripletSelectionComplete = () => {
    setSelectedPokemon([]);
  };

  return {
    selectedPokemon,
    setSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
};
