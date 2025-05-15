
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
    (storedBattleType as BattleType) || "pairs"
  );
  const [fullRankingMode, setFullRankingMode] = useState(
    storedRankingMode === 'true'
  );
  const [selectedGeneration, setSelectedGeneration] = useState(
    storedGeneration ? Number(storedGeneration) : 0
  );
  
  // React to localStorage changes for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = () => {
      const newBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
      const newRankingMode = localStorage.getItem('pokemon-ranker-full-ranking-mode') === 'true';
      const newGeneration = Number(localStorage.getItem('pokemon-ranker-generation') || '0');
      
      if (newBattleType && newBattleType !== battleType) {
        setBattleType(newBattleType);
      }
      
      if (newRankingMode !== fullRankingMode) {
        setFullRankingMode(newRankingMode);
      }
      
      if (newGeneration !== selectedGeneration) {
        setSelectedGeneration(newGeneration);
      }
    };
    
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
