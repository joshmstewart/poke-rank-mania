
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
    console.log("🔄 GENERATION CHANGE: Changing to generation:", genId);
    console.log("🔄 GENERATION CHANGE: Current battlesCompleted before change:", localStorage.getItem("pokemon-battle-count"));
    
    setSelectedGeneration(genId);
    localStorage.setItem("pokemon-ranker-generation", value);
    console.log("🔄 GENERATION CHANGE: Saved generation", value, "to localStorage");
    
    resetBattleState();
    console.log("🔄 GENERATION CHANGE: Battle state reset completed");
  };

  // Handle battle type change
  const handleBattleTypeChange = (value: BattleType) => {
    console.log("🔄 BATTLE TYPE CHANGE: Changing to:", value);
    console.log("🔄 BATTLE TYPE CHANGE: Current battlesCompleted before change:", localStorage.getItem("pokemon-battle-count"));
    
    localStorage.setItem("pokemon-ranker-battle-type", value);
    console.log("🔄 BATTLE TYPE CHANGE: Saved battle type", value, "to localStorage");
    
    resetBattleState();
    console.log("🔄 BATTLE TYPE CHANGE: Battle state reset completed");
  };

  // Reset battle state with detailed logging
  const resetBattleState = () => {
    console.log("🔄 RESET STATE: resetBattleState called - normal reset from generation/type change");
    console.log("🔄 RESET STATE: Current localStorage 'pokemon-battle-count':", localStorage.getItem("pokemon-battle-count"));
    
    setRankingGenerated(false);
    console.log("🔄 RESET STATE: Set rankingGenerated = false");
  
    setBattleResults([]);
    console.log("🔄 RESET STATE: Cleared battleResults");
    
    setBattlesCompleted(0);
    console.log("🔄 RESET STATE: Set battlesCompleted = 0");
    
    setBattleHistory([]);
    console.log("🔄 RESET STATE: Cleared battleHistory");

    setShowingMilestone(false);
    console.log("🔄 RESET STATE: Set showingMilestone = false");
    
    setCompletionPercentage(0);
    console.log("🔄 RESET STATE: Set completionPercentage = 0");
    
    // Remove battle count from localStorage
    const beforeValue = localStorage.getItem('pokemon-battle-count');
    localStorage.removeItem('pokemon-battle-count');
    console.log(`🔄 RESET STATE: Removed 'pokemon-battle-count' from localStorage: was ${beforeValue ? `"${beforeValue}"` : "empty"}`);
    
    console.log("🔄 RESET STATE: Pokemon count before filter:", allPokemon.length);
    
    if (Array.isArray(allPokemon) && allPokemon.length > 1) {
      // Filter the Pokemon based on the current form filters
      const filteredPokemon = allPokemon.filter(shouldIncludePokemon);
      console.log(`🔄 RESET STATE: Form filters applied: ${filteredPokemon.length} of ${allPokemon.length} Pokemon included`);
      
      // Only start a new battle if we have enough Pokemon after filtering
      if (filteredPokemon.length >= 2) {
        console.log("🔄 RESET STATE: Starting new battle after reset");
        startNewBattle(battleType);
      } else {
        console.error("🔄 RESET STATE: Not enough Pokemon after applying filters");
      }
    } else {
      console.error("🔄 RESET STATE: Not starting new battle: invalid allPokemon", allPokemon);
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
