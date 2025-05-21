import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleTypeSelection } from "./useBattleTypeSelection";
import { useBattleStateSelection } from "./useBattleStateSelection";
import { useBattleResults } from "./useBattleResults";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleOutcomeProcessor } from "./useBattleOutcomeProcessor";

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

  const startNewBattleAdapter = (pokemonList: Pokemon[], battleType: BattleType): Pokemon[] => {
    return startNewBattle(battleType);
  };

  const { processBattleResult } = useBattleOutcomeProcessor(
    setBattleResults,
    setBattlesCompleted,
    battleStarter
  );

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
    processBattleResult
  };
};
