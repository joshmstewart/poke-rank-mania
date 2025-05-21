
import { useState } from "react";

export const useProgressState = () => {
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [fullRankingMode, setFullRankingMode] = useState(false);
  
  // Predefined milestone check points (battles completed)
  const milestones = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  
  return {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    setFullRankingMode,
    milestones
  };
};
