
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleContentState } from "@/hooks/battle/useBattleContentState";
import BattleContentRenderer from "./BattleContentRenderer";

interface BattleContentCoreProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContentCore: React.FC<BattleContentCoreProps> = ({
  allPokemon,
  initialBattleType,
  initialSelectedGeneration = 0,
  setBattlesCompleted,
  setBattleResults
}) => {
  const stateData = useBattleContentState(
    allPokemon,
    initialBattleType,
    initialSelectedGeneration,
    setBattlesCompleted,
    setBattleResults
  );

  const {
    instanceRef,
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    setBattleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    setActiveTier,
    isBattleTransitioning,
    isAnyProcessing,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    isProcessingResult,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    handleSaveRankings,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles,
    resetMilestoneInProgress,
    performFullBattleReset,
    handleManualReorder,
    pendingRefinements,
    onRankingsUpdate
  } = stateData;

  console.log(`🔧 [BATTLE_CONTENT_CORE] Render - Instance: ${instanceRef.current}`);
  console.log(`🔧 [BATTLE_CONTENT_CORE] allPokemon: ${allPokemon?.length || 0}, initialBattleType: ${initialBattleType}`);

  return (
    <BattleContentRenderer
      showingMilestone={showingMilestone}
      currentBattle={currentBattle}
      selectedPokemon={selectedPokemon}
      battlesCompleted={battlesCompleted}
      battleType={battleType}
      battleHistory={battleHistory}
      selectedGeneration={selectedGeneration}
      finalRankings={finalRankings}
      activeTier={activeTier}
      milestones={milestones}
      rankingGenerated={rankingGenerated}
      isAnyProcessing={isAnyProcessing}
      setSelectedGeneration={setSelectedGeneration}
      setBattleType={setBattleType}
      setShowingMilestone={setShowingMilestone}
      setActiveTier={setActiveTier}
      handlePokemonSelect={handlePokemonSelect}
      handleTripletSelectionComplete={handleTripletSelectionComplete}
      goBack={goBack}
      handleContinueBattles={handleContinueBattles}
      performFullBattleReset={performFullBattleReset}
      handleSaveRankings={handleSaveRankings}
      suggestRanking={suggestRanking}
      removeSuggestion={removeSuggestion}
      resetMilestoneInProgress={resetMilestoneInProgress}
      handleManualReorder={handleManualReorder}
      onRankingsUpdate={onRankingsUpdate}
      setBattlesCompleted={setBattlesCompleted}
      setBattleResults={setBattleResults}
    />
  );
};

export default BattleContentCore;
