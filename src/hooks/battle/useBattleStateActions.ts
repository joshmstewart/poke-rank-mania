import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";

/**
 * Hook for managing battle state actions
 */
export interface UseBattleStateActionsProps {
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>;
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>;
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[]; selected: number[] }[]>>;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>;
  startNewBattle: (battleType: BattleType) => void;
  allPokemon: Pokemon[];
  generateRankings: (results: BattleResult) => void;
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
  const startNewBattleAdapter = (pokemonList: Pokemon[], battleType: BattleType) => {
    startNewBattle(battleType);
  };

  const {
    selectedGeneration: generationSetting,
    handleGenerationChange,
    handleBattleTypeChange
  } = useGenerationSettings(
    startNewBattleAdapter,
    allPokemon,
    setRankingGenerated,
    setBattleResults,
    setBattlesCompleted,
    setBattleHistory,
    setShowingMilestone,
    setCompletionPercentage
  );

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
