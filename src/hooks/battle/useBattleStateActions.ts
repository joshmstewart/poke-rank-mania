
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";
import { useGenerationState } from "./useGenerationState";

/**
 * Hook for managing battle state actions
 */
export interface UseBattleStateActionsProps {
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>;
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[]; selected: number[] }[]>>;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>;
  startNewBattle: (battleType: BattleType) => void;
  allPokemon: Pokemon[];
  generateRankings: (results: SingleBattle[]) => void;
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
  // Use the generation state management hook
  const { selectedGeneration, setSelectedGeneration } = useGenerationState();
  
  // Use our simplified hook to get the generation name
  const { generationName } = useGenerationSettings(selectedGeneration);
  
  // Handle generation change
  const handleGenerationChange = (value: string) => {
    const genId = parseInt(value);
    setSelectedGeneration(genId);
    localStorage.setItem("pokemon-ranker-generation", value);
    resetBattleState();
  };

  // Handle battle type change
  const handleBattleTypeChange = (value: BattleType) => {
    localStorage.setItem("pokemon-ranker-battle-type", value);
    resetBattleState();
  };

  // Reset battle state
  const resetBattleState = () => {
    setRankingGenerated(false);
    setBattleResults([]);
    setBattlesCompleted(0);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    if (Array.isArray(allPokemon) && allPokemon.length > 1) {
      startNewBattle(battleType);
    } else {
      console.error("❌ Not starting new battle: invalid allPokemon", allPokemon);
    }
  };

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
    handleGenerationChange: Object.assign(handleGenerationChange, { generationSetting: selectedGeneration }),
    handleBattleTypeChange,
    handleContinueBattles,
    handleNewBattleSet,
    generationName // Make sure to return the generationName from our simplified hook
  };
};
