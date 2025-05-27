
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

  // CRITICAL FIX: Show main content if we have a battle OR if we're transitioning (to prevent loading screen)
  const shouldShowMainContent = (currentBattle && currentBattle.length > 0) || isBattleTransitioning;

  console.log(`🔄 [LOADING_STATE_DEBUG] BattleContent display decisions:`, {
    shouldShowMainContent,
    hasCurrentBattle: !!currentBattle,
    battleLength: currentBattle?.length || 0,
    isBattleTransitioning,
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

  // CRITICAL FIX: Always show the interface if we have battle data OR are transitioning
  if (shouldShowMainContent) {
    console.log(`🔄 [LOADING_STATE_DEBUG] BattleContent rendering main interface - battle: ${currentBattle?.length || 0}, transitioning: ${isBattleTransitioning}`);
    
    return (
      <BattleInterface
        currentBattle={currentBattle || []} // Provide empty array as fallback during transition
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

  // Only show loading if we truly have no data and aren't transitioning
  console.log(`⏳ [LOADING_STATE_DEBUG] BattleContent showing loading state - no battle and not transitioning`);
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
