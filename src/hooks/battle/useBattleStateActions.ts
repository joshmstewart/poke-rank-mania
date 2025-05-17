
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";

/**
 * Hook for managing battle state actions
 */
export interface UseBattleStateActionsProps {
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>;
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>;
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>;
  startNewBattle: (battleType: BattleType) => void;
  allPokemon: Pokemon[];
  generateRankings: (results: any[]) => void;
  battleType: BattleType;
}

export const useBattleStateActions = ({
  setRankingGenerated,
  setBattleResults,
  setBattlesCompleted,
  setBattleHistory,
  setShowingMilestone,
  setCompletionPercentage,
  startNewBattle,
  allPokemon,
  generateRankings,
  battleType
}: UseBattleStateActionsProps) => {
  // Generation settings and battle type management
  const {
    selectedGeneration: generationSetting,
    handleGenerationChange,
    handleBattleTypeChange,
  } = useGenerationSettings(
    startNewBattle,
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage
  );
  
  // Battle actions like continuing battles and starting new sets
  const {
    handleContinueBattles,
    handleNewBattleSet
  } = useBattleActions(
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage,
    startNewBattle,
    generateRankings,
    battleType
  );
  
  return {
    handleGenerationChange: Object.assign(handleGenerationChange, { generationSetting }),
    handleBattleTypeChange,
    handleContinueBattles,
    handleNewBattleSet
  };
};
