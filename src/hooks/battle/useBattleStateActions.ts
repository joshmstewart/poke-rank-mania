
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useGenerationSettings } from "./useGenerationSettings";
import { useBattleActions } from "./useBattleActions";
import { useGenerationState } from "./useGenerationState";
import { useFormFilters } from "@/hooks/useFormFilters";

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
  
  // Add form filters
  const { filters, shouldIncludePokemon } = useFormFilters();
  
  // Handle generation change
  const handleGenerationChange = (value: string) => {
    const genId = parseInt(value);
    console.log("🚨 Generation change to:", genId);
    setSelectedGeneration(genId);
    localStorage.setItem("pokemon-ranker-generation", value);
    resetBattleState();
  };

  // Handle battle type change
  const handleBattleTypeChange = (value: BattleType) => {
    console.log("🚨 Battle type change to:", value);
    localStorage.setItem("pokemon-ranker-battle-type", value);
    resetBattleState();
  };

  // Reset battle state
  const resetBattleState = () => {
    console.log("🚨 resetBattleState called - normal reset from generation/type change");
    
    setRankingGenerated(false);
    console.log("🟢 setRankingGenerated explicitly set to FALSE.");
  
    setBattleResults([]);
    setBattlesCompleted(0);
    setBattleHistory([]);
    console.log("🔄 setBattleHistory explicitly reset to empty array.");

    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Remove battle count from localStorage
    localStorage.removeItem('pokemon-battle-count');
    console.log("✅ Cleared pokemon-battle-count from localStorage");
    
    console.log("🚨 Pokemon count before filter:", allPokemon.length);
    
    if (Array.isArray(allPokemon) && allPokemon.length > 1) {
      // Filter the Pokemon based on the current form filters
      const filteredPokemon = allPokemon.filter(shouldIncludePokemon);
      console.log(`Form filters applied: ${filteredPokemon.length} of ${allPokemon.length} Pokemon included`);
      
      // Only start a new battle if we have enough Pokemon after filtering
      if (filteredPokemon.length >= 2) {
        console.log("🚨 Starting new battle after reset");
        startNewBattle(battleType);
      } else {
        console.error("❌ Not enough Pokemon after applying filters");
      }
    } else {
      console.error("❌ Not starting new battle: invalid allPokemon", allPokemon);
    }
  };

  const {
    handleContinueBattles,
    handleNewBattleSet
  } = useBattleActions(
    // Pass the filtered Pokemon to battle actions
    allPokemon.filter(shouldIncludePokemon),
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
