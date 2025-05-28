
import { Pokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleProcessor } from "./useBattleProcessor";

export const useBattleActionsProcessing = (
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  filteredPokemon: Pokemon[],
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  setShowingMilestone: (show: boolean) => void,
  milestones: number[],
  generateRankings: (results: any[]) => any[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  activeTierAsTopNOption: TopNOption,
  freezePokemonForTierWrapper: (pokemonId: number, tier: TopNOption) => void,
  battleStarter: any,
  markSuggestionUsed: (suggestion: any) => void,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined
) => {
  const { 
    processBattleResult,
    isProcessingResult, 
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking
  } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    filteredPokemon,
    stableSetCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon,
    activeTierAsTopNOption,
    freezePokemonForTierWrapper,
    battleStarter,
    markSuggestionUsed,
    undefined,
    enhancedStartNewBattle
  );

  return {
    processBattleResult,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking
  };
};
