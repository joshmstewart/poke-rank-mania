
import React, { useEffect, useRef } from "react";
import BattleInterface from "./BattleInterface";
import RankingDisplay from "./RankingDisplay";
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

  // FIXED: Show the proper milestone screen with rankings
  if (showingMilestone) {
    console.log(`🏆 [MILESTONE_FIX] DISPLAYING MILESTONE RANKINGS SCREEN for ${battlesCompleted} battles`);
    
    // Get the snapshot for this milestone
    const milestoneSnapshot = getSnapshotForMilestone(battlesCompleted);
    const rankingsToShow = milestoneSnapshot.length > 0 ? milestoneSnapshot : finalRankings;
    
    return (
      <RankingDisplay
        finalRankings={rankingsToShow}
        battlesCompleted={battlesCompleted}
        onContinueBattles={() => {
          console.log(`🔄 [MILESTONE_FIX] Continue battles clicked from milestone screen`);
          setShowingMilestone(false);
          resetMilestoneInProgress();
          setTimeout(() => {
            handleContinueBattles();
          }, 300);
        }}
        onNewBattleSet={performFullBattleReset}
        rankingGenerated={rankingGenerated}
        onSaveRankings={handleSaveRankings}
        isMilestoneView={true}
        activeTier={activeTier}
        onTierChange={setActiveTier}
        onSuggestRanking={suggestRanking}
        onRemoveSuggestion={removeSuggestion}
      />
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
