
import React, { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import { RefinementQueueProvider } from "./RefinementQueueProvider";
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

const BattleContentCoreInner: React.FC<BattleContentCoreProps> = ({
  allPokemon,
  initialBattleType,
  initialSelectedGeneration = 0,
  setBattlesCompleted,
  setBattleResults
}) => {
  const instanceRef = useRef(`content-${Date.now()}`);
  
  console.log(`[DEBUG BattleContentCore] Instance: ${instanceRef.current} render - allPokemon: ${allPokemon?.length || 0}`);
  console.log(`🔄 [REFINEMENT_PROVIDER_WRAP] BattleContentCore wrapped with RefinementQueueProvider`);

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
    performFullBattleReset
  } = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  console.log(`🔄 [FINAL_FIX] BattleContentCore render states:`, {
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

  // Update parent state when local state changes
  useEffect(() => {
    setBattlesCompleted?.(battlesCompleted);
  }, [battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    setBattleResults?.(battleResults);
  }, [battleResults, setBattleResults]);

  // Show milestone screen
  if (showingMilestone) {
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
        handleContinueBattles={handleContinueBattles}
      />
    );
  }

  // Show loading when no battle data
  if (!currentBattle || currentBattle.length === 0) {
    return <BattleContentLoading />;
  }

  // Show main interface
  console.log(`✅ [FINAL_FIX] BattleContentCore rendering interface with ${currentBattle.length} Pokemon`);
  
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

const BattleContentCore: React.FC<BattleContentCoreProps> = (props) => {
  console.log(`🔄 [REFINEMENT_PROVIDER_OUTER] Wrapping BattleContentCore with RefinementQueueProvider`);
  return (
    <RefinementQueueProvider>
      <BattleContentCoreInner {...props} />
    </RefinementQueueProvider>
  );
};

export default BattleContentCore;
