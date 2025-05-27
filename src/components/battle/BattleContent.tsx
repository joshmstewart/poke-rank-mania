
import React, { useEffect, useRef } from "react";
import BattleInterface from "./BattleInterface";
import RankingDisplay from "./RankingDisplay";
import BattleSettings from "./BattleSettings";
import BattleControls from "./BattleControls";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  console.log(`🔄 [FINAL_FIX] BattleContent render states:`, {
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
    console.log(`🏆 [FINAL_FIX] DISPLAYING MILESTONE RANKINGS SCREEN for ${battlesCompleted} battles`);
    
    const milestoneSnapshot = getSnapshotForMilestone(battlesCompleted);
    const rankingsToShow = milestoneSnapshot.length > 0 ? milestoneSnapshot : finalRankings;
    
    return (
      <RankingDisplay
        finalRankings={rankingsToShow}
        battlesCompleted={battlesCompleted}
        onContinueBattles={() => {
          console.log(`🔄 [FINAL_FIX] Continue battles clicked from milestone screen`);
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

  // CRITICAL FIX: Only show loading when we actually don't have battle data
  if (!currentBattle || currentBattle.length === 0) {
    console.log(`⏳ [FINAL_FIX] Showing loading state - no battle data available`);
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
          <p className="text-sm text-gray-600">Initializing battles...</p>
        </div>
      </div>
    );
  }

  // Show interface immediately when we have valid battle data
  console.log(`✅ [FINAL_FIX] BattleContent rendering interface with ${currentBattle.length} Pokemon`);
  
  return (
    <div className="w-full">
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={(gen) => setSelectedGeneration(Number(gen))}
        onBattleTypeChange={setBattleType}
        onRestartBattles={performFullBattleReset}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
        performFullBattleReset={performFullBattleReset}
      />

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
    </div>
  );
};

export default BattleContent;
