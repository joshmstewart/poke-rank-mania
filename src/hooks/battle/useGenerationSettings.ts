
import { useState } from "react";
import { BattleType } from "./types";
import { Pokemon } from "@/services/pokemon";

export const useGenerationSettings = (
  startNewBattle: (pokemonList: Pokemon[]) => void,
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
) => {
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  const [fullRankingMode, setFullRankingMode] = useState(false);

  const handleGenerationChange = (value: string) => {
    setSelectedGeneration(Number(value));
  };

  const handleBattleTypeChange = (value: string) => {
    setBattleType(value as BattleType);
    // Reset battles and start new one with current Pokémon pool
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Important: Start a new battle with the correct number of Pokémon for the selected battle type
    if (allPokemon.length > 0) {
      // Create a new battle with the correct number of Pokémon
      const battleSize = value === "pairs" ? 2 : 3;
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const newBattle = shuffled.slice(0, battleSize);
      startNewBattle(allPokemon);
    }
  };

  return {
    selectedGeneration,
    setSelectedGeneration,
    battleType,
    setBattleType,
    fullRankingMode,
    setFullRankingMode,
    handleGenerationChange,
    handleBattleTypeChange
  };
};
