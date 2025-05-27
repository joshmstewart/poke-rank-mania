
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
  const milestoneHandledRef = useRef(false);
  const lastMilestoneTimeRef = useRef(0);
  
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

  console.log(`🔄 [MILESTONE_FIX] BattleContent render states:`, {
    showingMilestone,
    currentBattleLength: currentBattle?.length || 0,
    isProcessingResult,
    isBattleTransitioning,
    isAnyProcessing,
    hasBattle: !!currentBattle && currentBattle.length > 0,
    battlesCompleted,
    milestoneHandled: milestoneHandledRef.current,
    timestamp: new Date().toISOString()
  });

  // Update parent state when local state changes
  useEffect(() => {
    setBattlesCompleted?.(battlesCompleted);
  }, [battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    setBattleResults?.(battleResults);
  }, [battleResults, setBattleResults]);

  // CRITICAL FIX: Handle milestone with proper state reset and debouncing
  useEffect(() => {
    if (showingMilestone && !milestoneHandledRef.current) {
      const now = Date.now();
      
      // Debounce milestone handling to prevent rapid cycling
      if (now - lastMilestoneTimeRef.current < 1000) {
        console.log(`🔄 [MILESTONE_FIX] Debouncing milestone handling - too soon since last one`);
        return;
      }
      
      console.log(`🏆 [MILESTONE_FIX] Handling milestone at ${battlesCompleted} battles`);
      milestoneHandledRef.current = true;
      lastMilestoneTimeRef.current = now;
      
      // First, properly reset the milestone state
      setShowingMilestone(false);
      resetMilestoneInProgress();
      
      // Then start a new battle after a longer delay to ensure state is clean
      setTimeout(() => {
        console.log(`🔄 [MILESTONE_FIX] Starting new battle after milestone cleanup`);
        handleContinueBattles();
        milestoneHandledRef.current = false; // Reset for next milestone
      }, 500);
    }
  }, [showingMilestone, battlesCompleted, setShowingMilestone, resetMilestoneInProgress, handleContinueBattles]);

  // CRITICAL FIX: Always show interface if we have battle data - no loading states
  const shouldShowInterface = currentBattle && currentBattle.length > 0;

  console.log(`🔄 [MILESTONE_FIX] BattleContent shouldShowInterface:`, shouldShowInterface);

  // CRITICAL FIX: Only show interface, never show loading during normal operation
  if (shouldShowInterface) {
    console.log(`🔄 [MILESTONE_FIX] BattleContent rendering interface with ${currentBattle.length} Pokemon`);
    
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

  // CRITICAL FIX: Only show loading on initial load when we truly have no data
  console.log(`⏳ [MILESTONE_FIX] BattleContent showing initial loading - no battle data available yet`);
  return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
        <p className="text-sm text-gray-600">Initializing battles...</p>
      </div>
    </div>
  );
};

export default BattleContent;
