import React from "react";
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

  // ✅ Explicitly ensure finalRankings is RankedPokemon[]
  const safeFinalRankings: RankedPokemon[] = (finalRankings as RankedPokemon[]).map(pokemon => ({
    ...pokemon,
    score: (pokemon as RankedPokemon).score || 0,
    count: (pokemon as RankedPokemon).count || 0
  }));

  return (
    <BattleContent
      showingMilestone={showingMilestone}
      rankingGenerated={rankingGenerated}
      currentBattle={currentBattle}
      selectedPokemon={selectedPokemon}
      battlesCompleted={battlesCompleted}
      battleType={battleType}
      battleHistory={battleHistory}
      finalRankings={safeFinalRankings}  // ✅ now correctly typed
      milestones={milestones}
      onPokemonSelect={handlePokemonSelect}
      onTripletSelectionComplete={handleTripletSelectionComplete}
      onGoBack={goBack}
      onNewBattleSet={handleNewBattleSet}
      onContinueBattles={handleContinueBattles}
      onSaveRankings={handleSaveRankings}
      isProcessing={isProcessing}
    />
  );
};

export default BattleContentContainer;
