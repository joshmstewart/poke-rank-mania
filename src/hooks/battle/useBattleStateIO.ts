
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";
import { usePokemonLoader } from "./usePokemonLoader";
import { useLocalStorage } from "./useLocalStorage";
import { useRankings } from "./useRankings";
import { useCompletionTracker } from "./useCompletionTracker";
import { useState } from "react";

/**
 * Hook for handling input/output operations in the battle state
 */
export interface UseBattleStateIOProps {
  setAllPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>;
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>;
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>;
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>;
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>;
  startNewBattle: (battleType: BattleType) => void; // Updated to match the actual signature
  battleType: BattleType;
  allPokemon: Pokemon[];
  battleResults: BattleResult;
}

export const useBattleStateIO = ({
  setAllPokemon,
  setRankingGenerated,
  setBattleResults,
  setBattlesCompleted,
  setBattleHistory,
  setShowingMilestone,
  setCompletionPercentage,
  setSelectedPokemon,
  startNewBattle,
  battleType,
  allPokemon,
  battleResults
}: UseBattleStateIOProps) => {
  // Pokemon loading logic
  const {
    isLoading,
    loadPokemon
  } = usePokemonLoader({
    setAllPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    setSelectedPokemon,
    startNewBattle, // Now this matches the expected signature
    battleType
  });
  
  // Local storage management
  const { saveBattleState, loadBattleState } = useLocalStorage();
  
  // Rankings generation and management
  const { finalRankings, generateRankings, handleSaveRankings } = useRankings(allPokemon);
  
  // Completion tracking
  const {
    calculateCompletionPercentage,
    getBattlesRemaining
  } = useCompletionTracker(
    allPokemon,
    battleResults,
    setRankingGenerated,
    generateRankings,
    setCompletionPercentage
  );
  
  return {
    isLoading,
    loadPokemon,
    saveBattleState,
    loadBattleState,
    finalRankings,
    generateRankings,
    handleSaveRankings,
    calculateCompletionPercentage,
    getBattlesRemaining
  };
};
