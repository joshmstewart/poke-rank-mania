
import { useMemo, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleTypeSelection } from "./useBattleTypeSelection";
import { useBattleStateSelection } from "./useBattleStateSelection";
import { useBattleResults } from "./useBattleResults";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleOutcomeProcessor } from "./useBattleOutcomeProcessor";
import { toast } from "sonner";

export const useBattleSelectionState = () => {
  const { currentBattleType, setCurrentBattleType } = useBattleTypeSelection();

  const {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory
  } = useBattleStateSelection();

  const {
    battleResults,
    setBattleResults,
    getCurrentRankings
  } = useBattleResults();

  // ⚠️ Ensure currentRankings always has full RankedPokemon structure
  const currentRankings = useMemo<RankedPokemon[]>(() => {
    if (Array.isArray(battleResults) && battleResults.length > 0) {
      return getCurrentRankings();
    }

    // Fallback: convert raw Pokémon into dummy RankedPokemon
    return (allPokemon || []).map(pokemon => ({
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0
    }));
  }, [battleResults, allPokemon, getCurrentRankings]);

  const { battleStarter, startNewBattle } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon
  );

  const startNewBattleAdapter = useCallback((pokemonList: Pokemon[], battleType: BattleType): Pokemon[] => {
    return startNewBattle(battleType);
  }, [startNewBattle]);

  const { processBattleResult } = useBattleOutcomeProcessor(
    setBattleResults,
    setBattlesCompleted,
    battleStarter
  );
  
  // Enhanced forceNextBattle with error handling and user feedback
  const forceNextBattle = useCallback(() => {
    console.log("🔄 useBattleSelectionState: Force starting next battle");
    
    try {
      // Try to start a new battle
      const result = startNewBattle(currentBattleType);
      
      // Provide feedback to user
      if (result && result.length > 0) {
        toast.success("Starting new battle", {
          description: `New ${currentBattleType} battle ready`
        });
        return result;
      } else {
        toast.error("Error starting battle", {
          description: "Could not create new battle. Please try again."
        });
        return [];
      }
    } catch (error) {
      console.error("Error in forceNextBattle:", error);
      toast.error("Failed to start battle", {
        description: "An unexpected error occurred."
      });
      return [];
    }
  }, [currentBattleType, startNewBattle]);

  return {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    startNewBattle,
    currentBattleType,
    processBattleResult,
    forceNextBattle // Export the enhanced function
  };
};
