
import React, { useEffect, useRef } from "react";
import BattleInterface from "./BattleInterface";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContent: React.FC<BattleContentProps> = ({
  allPokemon,
  initialBattleType,
  initialSelectedGeneration = 0,
  setBattlesCompleted,
  setBattleResults
}) => {
  const instanceRef = useRef(`content-${Date.now()}`);
  console.log(`[DEBUG BattleContent] Instance: ${instanceRef.current} render - allPokemon: ${allPokemon?.length || 0}`);

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

  console.log(`🔄 [LOADING_STATE_DEBUG] BattleContent render states:`, {
    showingMilestone,
    currentBattleLength: currentBattle?.length || 0,
    isProcessingResult,
    isBattleTransitioning,
    isAnyProcessing,
    timestamp: new Date().toISOString()
  });

  // Update parent state when local state changes
  useEffect(() => {
    setBattlesCompleted?.(battlesCompleted);
  }, [battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    setBattleResults?.(battleResults);
  }, [battleResults, setBattleResults]);

  // CRITICAL FIX: Don't show skeleton when we have a valid battle but are just processing
  const shouldShowMainContent = currentBattle && currentBattle.length > 0;

  console.log(`🔄 [LOADING_STATE_DEBUG] BattleContent display decisions:`, {
    shouldShowMainContent,
    hasCurrentBattle: !!currentBattle,
    battleLength: currentBattle?.length || 0,
    timestamp: new Date().toISOString()
  });

  // TEMPORARY: Skip milestone modal until it's available
  if (showingMilestone) {
    console.log(`🏆 [LOADING_STATE_DEBUG] BattleContent would show milestone modal but component not available`);
    // Auto-continue battles instead of showing milestone
    setTimeout(() => {
      handleContinueBattles();
    }, 100);
  }

  if (shouldShowMainContent) {
    console.log(`🔄 [LOADING_STATE_DEBUG] BattleContent rendering main interface with ${currentBattle.length} Pokemon`);
    
    return (
      <BattleInterface
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        battleHistory={battleHistory}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        onGoBack={goBack}
        milestones={milestones}
        isProcessing={isAnyProcessing}
      />
    );
  }

  // CRITICAL FIX: Minimal loading state - no skeleton, just a simple message
  console.log(`⏳ [LOADING_STATE_DEBUG] BattleContent showing minimal loading state`);
  return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
        <p className="text-sm text-gray-600">Preparing next battle...</p>
      </div>
    </div>
  );
};

export default BattleContent;
