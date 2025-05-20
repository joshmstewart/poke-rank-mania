import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleState = () => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>("pairs");

  return {
    currentBattle,
    setCurrentBattle,
    battlesCompleted,
    setBattlesCompleted,
    battleResults,
    setBattleResults,
    battleHistory,
    setBattleHistory,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    selectedPokemon,
    setSelectedPokemon,
    battleType,
    setBattleType
  };
};
