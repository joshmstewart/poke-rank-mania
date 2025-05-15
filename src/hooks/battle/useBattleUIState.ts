
import { useState } from "react";
import { BattleType } from "./types";

export const useBattleUIState = () => {
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  const [fullRankingMode, setFullRankingMode] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  
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
