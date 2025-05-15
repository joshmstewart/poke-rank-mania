
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
  
  const storedRankingMode = localStorage.getItem('pokemon-ranker-full-ranking-mode');
  const initialRankingMode = storedRankingMode === null ? true : storedRankingMode === 'true';
  
  const [selectedGeneration, setSelectedGeneration] = useState(initialGeneration);
  const [fullRankingMode, setFullRankingModeState] = useState(initialRankingMode);
  
  // Set defaults in localStorage if not already set
  useEffect(() => {
    if (!localStorage.getItem('pokemon-ranker-generation')) {
      localStorage.setItem('pokemon-ranker-generation', '0');
    }
    
    if (localStorage.getItem('pokemon-ranker-full-ranking-mode') === null) {
      localStorage.setItem('pokemon-ranker-full-ranking-mode', 'true'); // Set default to true
    }
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
  
  const handleRankingModeChange = (value: boolean) => {
    setFullRankingModeState(value);
    localStorage.setItem('pokemon-ranker-full-ranking-mode', value.toString());
    
    // Reset battle state when mode changes
    resetBattleState();
  };
  
  const resetBattleState = () => {
    setRankingGenerated(false);
    setBattleResults([]);
    setBattlesCompleted(0);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Only start a new battle if we have Pokémon loaded
    if (allPokemon && allPokemon.length > 1) {
      // Use the current battle type from localStorage
      const currentBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || 'pairs';
      startNewBattle(allPokemon, currentBattleType);
    }
  };
  
  return {
    selectedGeneration,
    fullRankingMode,
    handleGenerationChange,
    handleBattleTypeChange,
    setFullRankingMode: handleRankingModeChange
  };
};
