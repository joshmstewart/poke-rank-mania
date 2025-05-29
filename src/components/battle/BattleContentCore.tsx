
import React, { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import BattleContentHeader from "./BattleContentHeader";
import BattleContentMain from "./BattleContentMain";
import BattleContentMilestone from "./BattleContentMilestone";
import BattleContentLoading from "./BattleContentLoading";

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
  const instanceRef = useRef(`content-${Date.now()}`);
  
  console.log(`🔧 [BATTLE_CONTENT_CORE] Render - Instance: ${instanceRef.current}`);
  console.log(`🔧 [BATTLE_CONTENT_CORE] allPokemon: ${allPokemon?.length || 0}, initialBattleType: ${initialBattleType}`);

  // Use the simplified core hook
  const stateHook = useBattleStateCore(
    allPokemon || [], 
    initialBattleType, 
    initialSelectedGeneration
  );

  // Update parent state when needed
  useEffect(() => {
    if (setBattlesCompleted) {
      setBattlesCompleted(stateHook.battlesCompleted);
    }
  }, [stateHook.battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    if (setBattleResults) {
      setBattleResults(stateHook.battleResults);
    }
  }, [stateHook.battleResults, setBattleResults]);

  const {
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
    pendingRefinements
  } = stateHook;

  console.log(`🔧 [BATTLE_CONTENT_CORE] Render decision - showingMilestone: ${showingMilestone}, currentBattle: ${currentBattle?.length || 0}`);

  // Show milestone screen
  if (showingMilestone) {
    return (
      <BattleContentMilestone
        finalRankings={finalRankings}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        activeTier={activeTier}
        getSnapshotForMilestone={() => JSON.stringify({ battlesCompleted, battleResults, finalRankings })}
        onContinueBattles={handleContinueBattles}
        performFullBattleReset={performFullBattleReset}
        handleSaveRankings={handleSaveRankings}
        setActiveTier={setActiveTier}
        suggestRanking={suggestRanking}
        removeSuggestion={removeSuggestion}
        setShowingMilestone={setShowingMilestone}
        resetMilestoneInProgress={resetMilestoneInProgress}
        handleManualReorder={handleManualReorder}
        pendingRefinements={new Set<number>()}
      />
    );
  }

  // Show loading when no battle data
  if (!currentBattle || currentBattle.length === 0) {
    console.log(`🔧 [BATTLE_CONTENT_CORE] Showing loading - no battle data`);
    return <BattleContentLoading />;
  }

  // Show main interface
  console.log(`🔧 [BATTLE_CONTENT_CORE] Showing main interface with ${currentBattle.length} Pokemon`);
  
  return (
    <div className="w-full">
      <BattleContentHeader
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={setSelectedGeneration}
        setBattleType={setBattleType}
        performFullBattleReset={performFullBattleReset}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
      />

      <BattleContentMain
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        battleHistory={battleHistory}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        onGoBack={goBack}
        milestones={milestones}
        isAnyProcessing={isAnyProcessing}
      />
    </div>
  );
};

export default BattleContentCore;
