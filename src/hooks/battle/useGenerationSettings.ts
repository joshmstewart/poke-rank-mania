
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";

export const useGenerationSettings = (
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  // Get initial values from localStorage if available
  const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
  const initialGeneration = storedGeneration ? parseInt(storedGeneration) : 0;
  
  const [selectedGeneration, setSelectedGeneration] = useState(initialGeneration);
  
  // Set defaults in localStorage if not already set
  useEffect(() => {
    if (!localStorage.getItem('pokemon-ranker-generation')) {
      localStorage.setItem('pokemon-ranker-generation', '0');
    }
    
    // Always set full ranking mode to true
    localStorage.setItem('pokemon-ranker-full-ranking-mode', 'true');
  }, []);
  
  const handleGenerationChange = (value: string) => {
    const genId = parseInt(value);
    setSelectedGeneration(genId);
    localStorage.setItem('pokemon-ranker-generation', value);
    
    // When generation changes, reset battle state
    resetBattleState();
  };
  
  const handleBattleTypeChange = (value: BattleType) => {
    localStorage.setItem('pokemon-ranker-battle-type', value);
    
    // Reset battle state when type changes
    resetBattleState();
  };
  
const resetBattleState = () => {
  setRankingGenerated(false);
  setBattleResults([]);
  setBattlesCompleted(0);
  setBattleHistory([]);
  setShowingMilestone(false);
  setCompletionPercentage(0);

  // ✅ Add strict type guard
  if (Array.isArray(allPokemon) && allPokemon.length > 1 && typeof allPokemon[0] === 'object') {
    const stored = localStorage.getItem("pokemon-ranker-battle-type");
    const currentBattleType: BattleType = stored === "triplets" ? "triplets" : "pairs";
    startNewBattle(allPokemon, currentBattleType);
  } else {
    console.error("❌ Cannot start battle — allPokemon is invalid", allPokemon);
  }
};


  
  return {
    selectedGeneration,
    handleGenerationChange,
    handleBattleTypeChange,
  };
};
