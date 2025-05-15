
import { useState, useEffect } from "react";
import { BattleType } from "./types";

export const useBattleUIState = () => {
  // Initialize with values from localStorage if available
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const storedRankingMode = localStorage.getItem('pokemon-ranker-full-ranking-mode');
  const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
  
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [battleType, setBattleType] = useState<BattleType>(
    (storedBattleType as BattleType) === "triplets" ? "triplets" : "pairs"
  );
  const [fullRankingMode, setFullRankingMode] = useState(
    storedRankingMode === 'true'
  );
  const [selectedGeneration, setSelectedGeneration] = useState(
    storedGeneration ? Number(storedGeneration) : 0
  );
  
  // React to localStorage changes for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pokemon-ranker-battle-type') {
        const newBattleType = e.newValue as BattleType;
        if (newBattleType && (newBattleType === "pairs" || newBattleType === "triplets") && newBattleType !== battleType) {
          console.log("Storage event: Setting battle type to", newBattleType);
          setBattleType(newBattleType);
        }
      } else if (e.key === 'pokemon-ranker-full-ranking-mode') {
        const newRankingMode = e.newValue === 'true';
        if (newRankingMode !== fullRankingMode) {
          setFullRankingMode(newRankingMode);
        }
      } else if (e.key === 'pokemon-ranker-generation') {
        const newGeneration = Number(e.newValue || '0');
        if (newGeneration !== selectedGeneration) {
          setSelectedGeneration(newGeneration);
        }
      }
    };
    
    // Also check on initial load
    const currentBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
    if (currentBattleType && (currentBattleType === "pairs" || currentBattleType === "triplets") && currentBattleType !== battleType) {
      console.log("Initial load: Setting battle type to", currentBattleType);
      setBattleType(currentBattleType);
    }
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [battleType, fullRankingMode, selectedGeneration]);
  
  // Milestone triggers - show rankings at these battle counts
  const milestones = [10, 25, 50, 100, 200, 500, 1000];

  return {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    battleType,
    setBattleType,
    fullRankingMode,
    setFullRankingMode,
    selectedGeneration,
    setSelectedGeneration,
    milestones
  };
};
