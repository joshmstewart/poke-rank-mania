
import { useState, useEffect } from "react";
import { BattleType } from "./types";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const useGenerationSettings = (
  startNewBattle: (pokemonList: Pokemon[], battleType: BattleType) => void,
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
) => {
  // Get initial values from localStorage if available
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const storedRankingMode = localStorage.getItem('pokemon-ranker-full-ranking-mode');
  const storedGeneration = localStorage.getItem('pokemon-ranker-generation');

  const [selectedGeneration, setSelectedGeneration] = useState(
    storedGeneration ? Number(storedGeneration) : 0
  );
  const [battleType, setBattleType] = useState<BattleType>(
    (storedBattleType as BattleType) || "pairs"
  );
  const [fullRankingMode, setFullRankingMode] = useState(
    storedRankingMode === 'true'
  );

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('pokemon-ranker-battle-type', battleType);
    localStorage.setItem('pokemon-ranker-full-ranking-mode', fullRankingMode.toString());
    localStorage.setItem('pokemon-ranker-generation', selectedGeneration.toString());
  }, [battleType, fullRankingMode, selectedGeneration]);

  const handleGenerationChange = (value: string) => {
    const newGeneration = Number(value);
    setSelectedGeneration(newGeneration);
    localStorage.setItem('pokemon-ranker-generation', value);
  };

  const handleBattleTypeChange = (value: string) => {
    if (!value) return; // Don't proceed if no value
    
    const newBattleType = value as BattleType;
    console.log("Changing battle type to:", newBattleType);
    setBattleType(newBattleType);
    localStorage.setItem('pokemon-ranker-battle-type', newBattleType);
    
    // Reset battles and start new one with current Pokémon pool
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Important: Start a new battle with the correct number of Pokémon for the selected battle type
    if (allPokemon.length > 0) {
      startNewBattle(allPokemon, newBattleType);
    } else {
      toast({
        title: "No Pokémon available",
        description: "Please load Pokémon first before changing battle type."
      });
    }
  };

  const handleRankingModeChange = (value: boolean) => {
    setFullRankingMode(value);
    localStorage.setItem('pokemon-ranker-full-ranking-mode', value.toString());
  };

  return {
    selectedGeneration,
    setSelectedGeneration,
    battleType,
    setBattleType,
    fullRankingMode,
    setFullRankingMode: handleRankingModeChange,
    handleGenerationChange,
    handleBattleTypeChange
  };
};
