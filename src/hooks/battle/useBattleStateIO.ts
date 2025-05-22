
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { usePokemonLoader } from "./usePokemonLoader";
import { useLocalStorage } from "./useLocalStorage";
import { useRankings } from "./useRankings";

/**
 * Hook for handling input/output operations in the battle state
 */
export interface UseBattleStateIOProps {
  setAllPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>;
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>;
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>;
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>;
  startNewBattle: (battleType: BattleType) => void;
  battleType: BattleType;
  allPokemon: Pokemon[];
  battleResults: SingleBattle[];
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
  } = usePokemonLoader();

  // Local storage management
  const { saveBattleState, loadBattleState } = useLocalStorage();

  // Rankings generation and management
  const { finalRankings, generateRankings } = useRankings(allPokemon);
  
  // Add missing handleSaveRankings function
  const handleSaveRankings = () => {
    // Save current battle state to localStorage
    saveBattleState({
      battleResults,
      battleType,
      battlesCompleted: battleResults.length,
      allPokemon,
      finalRankings
    });
  };

  // Simple calculation for battles remaining
  const getBattlesRemaining = () => {
    const uniquePokemonCount = allPokemon.length || 1;
    const log2N = Math.log2(uniquePokemonCount);
    return Math.max(0, Math.ceil(uniquePokemonCount * log2N) - battleResults.length);
  };

  return {
    isLoading,
    loadPokemon,
    saveBattleState,
    loadBattleState,
    finalRankings,
    generateRankings,
    handleSaveRankings,
    getBattlesRemaining
  };
};
