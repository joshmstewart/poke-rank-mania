import React, { useCallback } from "react";
import BattleContent from "./BattleContent";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import { RankedPokemon } from "@/hooks/battle/useRankings";

const BattleContentContainer: React.FC = () => {
  const {
    showingMilestone,
    rankingGenerated,
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    battleType,
    battleHistory,
    finalRankings,
    milestones,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    handleNewBattleSet,
    handleContinueBattles,
    handleSaveRankings,
    isProcessing
  } = useBattleStateCore();

  const safeFinalRankings: RankedPokemon[] = (finalRankings as RankedPokemon[]).map(pokemon => ({
    ...pokemon,
    score: (pokemon as RankedPokemon).score || 0,
    count: (pokemon as RankedPokemon).count || 0
  }));

  // ✅ Fixed handlers with correct signatures
  const onPokemonSelect = useCallback(
    (id: number) => handlePokemonSelect(id, battleType, currentBattle),
    [handlePokemonSelect, battleType, currentBattle]
  );

  const onTripletSelectionComplete = useCallback(
    () => handleTripletSelectionComplete(battleType, currentBattle),
    [handleTripletSelectionComplete, battleType, currentBattle]
  );

  return (
    <BattleContent
      showingMilestone={showingMilestone}
      rankingGenerated={rankingGenerated}
      currentBattle={currentBattle}
      selectedPokemon={selectedPokemon}
      battlesCompleted={battlesCompleted}
      battleType={battleType}
      battleHistory={battleHistory}
      finalRankings={safeFinalRankings}
      milestones={milestones}
      onPokemonSelect={onPokemonSelect} // ✅ now correct
      onTripletSelectionComplete={onTripletSelectionComplete} // ✅ now correct
      onGoBack={goBack}
      onNewBattleSet={handleNewBattleSet}
      onContinueBattles={handleContinueBattles}
      onSaveRankings={handleSaveRankings}
      isProcessing={isProcessing}
    />
  );
};

export default BattleContentContainer;
