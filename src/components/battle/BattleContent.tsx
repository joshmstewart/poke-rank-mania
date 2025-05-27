
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
  const milestoneDisplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    timestamp: new Date().toISOString()
  });

  // Update parent state when local state changes
  useEffect(() => {
    setBattlesCompleted?.(battlesCompleted);
  }, [battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    setBattleResults?.(battleResults);
  }, [battleResults, setBattleResults]);

  // CRITICAL FIX: Proper milestone handling with visual display
  useEffect(() => {
    if (showingMilestone) {
      console.log(`🏆 [MILESTONE_FIX] MILESTONE REACHED: ${battlesCompleted} battles completed!`);
      
      // Clear any existing timeout
      if (milestoneDisplayTimeoutRef.current) {
        clearTimeout(milestoneDisplayTimeoutRef.current);
      }
      
      // Show milestone message for 3 seconds
      milestoneDisplayTimeoutRef.current = setTimeout(() => {
        console.log(`🔄 [MILESTONE_FIX] Dismissing milestone after display time`);
        setShowingMilestone(false);
        resetMilestoneInProgress();
        
        // Continue battles after milestone is dismissed
        setTimeout(() => {
          handleContinueBattles();
        }, 300);
      }, 3000);
    }
    
    return () => {
      if (milestoneDisplayTimeoutRef.current) {
        clearTimeout(milestoneDisplayTimeoutRef.current);
      }
    };
  }, [showingMilestone, battlesCompleted, setShowingMilestone, resetMilestoneInProgress, handleContinueBattles]);

  // CRITICAL FIX: Show milestone display when milestone is active
  if (showingMilestone) {
    console.log(`🏆 [MILESTONE_FIX] Displaying milestone for ${battlesCompleted} battles`);
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Milestone Reached!</h2>
          <p className="text-lg text-gray-600 mb-4">
            You've completed <span className="font-semibold text-blue-600">{battlesCompleted}</span> battles!
          </p>
          <div className="text-sm text-gray-500">
            Rankings have been updated...
          </div>
        </div>
      </div>
    );
  }

  // Show interface if we have battle data
  const shouldShowInterface = currentBattle && currentBattle.length > 0;

  console.log(`🔄 [MILESTONE_FIX] BattleContent shouldShowInterface:`, shouldShowInterface);

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

  // Show loading on initial load when we truly have no data
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
