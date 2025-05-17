
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleTypeSelection } from "./useBattleTypeSelection";
import { useBattleStateSelection } from "./useBattleStateSelection";
import { useBattleResults } from "./useBattleResults";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleOutcomeProcessor } from "./useBattleOutcomeProcessor";

export const useBattleSelectionState = () => {
  // Use the extracted hooks
  const { currentBattleType, setCurrentBattleType } = useBattleTypeSelection();
  
  const { 
    currentBattle, setCurrentBattle,
    allPokemon, setAllPokemon,
    selectedPokemon, setSelectedPokemon,
    battlesCompleted, setBattlesCompleted,
    battleHistory, setBattleHistory
  } = useBattleStateSelection();
  
  const { battleResults, setBattleResults, getCurrentRankings } = useBattleResults();
  
  // Current rankings from battle results or all Pokemon
  const currentRankings = useMemo(() => {
    return Array.isArray(battleResults) && battleResults.length > 0
      ? getCurrentRankings()
      : allPokemon || [];
  }, [battleResults, allPokemon, getCurrentRankings]);
  
  const { battleStarter, startNewBattle } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon
  );
  
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
