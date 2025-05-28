
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
  
  console.log(`🔧 [HOOK_ORDER_FIX] BattleContentCore render - Instance: ${instanceRef.current}`);
  console.log(`🔧 [HOOK_ORDER_FIX] allPokemon: ${allPokemon?.length || 0}, initialBattleType: ${initialBattleType}`);

  // CRITICAL FIX: Always call useBattleStateCore unconditionally to prevent hook order issues
  const stateHook = useBattleStateCore(
    allPokemon || [], 
    initialBattleType, 
    initialSelectedGeneration
  );

  // CRITICAL FIX: Always call useEffect hooks in the same order, unconditionally
  useEffect(() => {
    console.log(`🔧 [HOOK_ORDER_FIX] setBattlesCompleted useEffect - battlesCompleted: ${stateHook.battlesCompleted}`);
    if (setBattlesCompleted) {
      setBattlesCompleted(stateHook.battlesCompleted);
    }
  }, [stateHook.battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    console.log(`🔧 [HOOK_ORDER_FIX] setBattleResults useEffect - battleResults length: ${stateHook.battleResults.length}`);
    if (setBattleResults) {
      setBattleResults(stateHook.battleResults);
    }
  }, [stateHook.battleResults, setBattleResults]);

  // Destructure after all hooks to ensure consistent hook ordering
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

  console.log(`🔧 [HOOK_ORDER_FIX] All hooks called successfully, proceeding with render logic`);
  console.log(`🔧 [HOOK_ORDER_FIX] Render states:`, {
    showingMilestone,
    isBattleTransitioning,
    currentBattleLength: currentBattle?.length || 0,
    currentBattleIds: currentBattle?.map(p => p.id).join(',') || '',
    isProcessingResult,
    isAnyProcessing,
    hasBattle: !!currentBattle && currentBattle.length > 0,
    battlesCompleted,
    timestamp: new Date().toISOString()
  });

  // Show milestone screen
  if (showingMilestone) {
    console.log(`🔧 [HOOK_ORDER_FIX] Rendering milestone screen`);
    return (
      <BattleContentMilestone
        finalRankings={finalRankings}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        activeTier={activeTier}
        getSnapshotForMilestone={getSnapshotForMilestone}
        onContinueBattles={handleContinueBattles}
        performFullBattleReset={performFullBattleReset}
        handleSaveRankings={handleSaveRankings}
        setActiveTier={setActiveTier}
        suggestRanking={suggestRanking}
        removeSuggestion={removeSuggestion}
        setShowingMilestone={setShowingMilestone}
        resetMilestoneInProgress={resetMilestoneInProgress}
        handleManualReorder={handleManualReorder}
        pendingRefinements={pendingRefinements}
      />
    );
  }

  // Show loading when no battle data
  if (!currentBattle || currentBattle.length === 0) {
    console.log(`🔧 [HOOK_ORDER_FIX] Rendering loading screen - no battle data`);
    return <BattleContentLoading />;
  }

  // Show main interface
  console.log(`🔧 [HOOK_ORDER_FIX] Rendering main interface with ${currentBattle.length} Pokemon`);
  
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
