import { useState, useEffect } from "react";
import { BattleType } from "./types";

export const useBattleUIState = () => {
  // Initialize with values from localStorage if available
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
  
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [battleType, setBattleType] = useState<BattleType>(
    (storedBattleType === "triplet") ? "triplet" : "pair"
  );
  
  // Always use full ranking mode, but keep in localStorage for compatibility
  const fullRankingMode = true;
  localStorage.setItem('pokemon-ranker-full-ranking-mode', 'true');
  
  const [selectedGeneration, setSelectedGeneration] = useState(
    storedGeneration ? Number(storedGeneration) : 0
  );
  
  // Update battleType when localStorage changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const currentValue = localStorage.getItem('pokemon-ranker-battle-type');
      if (currentValue && (currentValue === "pair" || currentValue === "triplet") && currentValue !== battleType) {
        console.log("useBattleUIState: Detected localStorage change for battle type:", currentValue);
        setBattleType(currentValue as BattleType);
      }
    };
    
    // Initial check
    checkLocalStorage();
    
    // Listen for storage changes
    window.addEventListener('storage', checkLocalStorage);
    
    // Check periodically (every second) as a fallback
    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => {
      window.removeEventListener('storage', checkLocalStorage);
      clearInterval(interval);
    };
  }, [battleType]);
  
  // Milestone triggers - show rankings at these battle counts
  // Add more frequent early milestones, then cap at showing every 50 battles
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];

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
    // No setter for fullRankingMode since it's always true
    selectedGeneration,
    setSelectedGeneration,
    milestones
  };
};
