import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleSelectionManager } from "./useBattleSelectionManager";

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
  initialSelectedPokemon: number[] = []
) => {
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>(initialSelectedPokemon);

  const { handleSelection } = useBattleSelectionManager(
    currentBattlePokemon,
    battleType,
    battleResults,
    battlesCompleted,
    setBattleResults,
    setBattlesCompleted,
    allPokemon,
    startNewBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon
  );

  const handlePokemonSelect = (pokemonId: number) => {
    setSelectedPokemon((prevSelected) => {
      const updatedSelection = [...prevSelected, pokemonId];
      handleSelection(updatedSelection);
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
    handleTripletSelectionComplete,
    handleSelection
  };
};
