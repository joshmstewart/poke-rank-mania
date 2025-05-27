
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
  const lastMilestoneRef = useRef<number | null>(null);
  
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

  // CRITICAL FIX: Track when we're transitioning from milestone to prevent flash
  const isTransitioningFromMilestone = useRef(false);
  
  // Track milestone transitions to prevent showing stale battles
  useEffect(() => {
    if (showingMilestone && lastMilestoneRef.current !== battlesCompleted) {
      console.log(`🏆 [FLASH_FIX] Milestone ${battlesCompleted} showing - marking transition state`);
      lastMilestoneRef.current = battlesCompleted;
      isTransitioningFromMilestone.current = true;
    } else if (!showingMilestone && isTransitioningFromMilestone.current) {
      console.log(`🔄 [FLASH_FIX] Milestone dismissed - staying in transition until new battle ready`);
      // Don't clear transition state yet - wait for new battle
    }
  }, [showingMilestone, battlesCompleted]);

  // Clear transition state only when new battle is actually ready
  useEffect(() => {
    if (!showingMilestone && currentBattle && currentBattle.length > 0 && isTransitioningFromMilestone.current) {
      console.log(`✅ [FLASH_FIX] New battle ready after milestone - clearing transition state`);
      isTransitioningFromMilestone.current = false;
    }
  }, [showingMilestone, currentBattle]);

  console.log(`🔄 [FLASH_FIX] BattleContent render states:`, {
    showingMilestone,
    isBattleTransitioning,
    isTransitioningFromMilestone: isTransitioningFromMilestone.current,
    currentBattleLength: currentBattle?.length || 0,
    isProcessingResult,
    isAnyProcessing,
    hasBattle: !!currentBattle && currentBattle.length > 0,
    battlesCompleted,
    lastMilestone: lastMilestoneRef.current,
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
    console.log(`🏆 [FLASH_FIX] DISPLAYING MILESTONE RANKINGS SCREEN for ${battlesCompleted} battles`);
    
    const milestoneSnapshot = getSnapshotForMilestone(battlesCompleted);
    const rankingsToShow = milestoneSnapshot.length > 0 ? milestoneSnapshot : finalRankings;
    
    return (
      <RankingDisplay
        finalRankings={rankingsToShow}
        battlesCompleted={battlesCompleted}
        onContinueBattles={() => {
          console.log(`🔄 [FLASH_FIX] Continue battles clicked from milestone screen`);
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

  // CRITICAL FIX: Show loading during any transition to prevent flash
  if (isBattleTransitioning || isTransitioningFromMilestone.current) {
    console.log(`⏳ [FLASH_FIX] Showing transition loading state - isBattleTransitioning: ${isBattleTransitioning}, isTransitioningFromMilestone: ${isTransitioningFromMilestone.current}`);
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
          <p className="text-sm text-gray-600">Starting next battle...</p>
        </div>
      </div>
    );
  }

  // Show interface if we have battle data
  const shouldShowInterface = currentBattle && currentBattle.length > 0;

  console.log(`🔄 [FLASH_FIX] BattleContent shouldShowInterface:`, shouldShowInterface);

  if (shouldShowInterface) {
    console.log(`🔄 [FLASH_FIX] BattleContent rendering interface with ${currentBattle.length} Pokemon`);
    
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
  }

  // Show loading on initial load when we truly have no data
  console.log(`⏳ [FLASH_FIX] BattleContent showing initial loading - no battle data available yet`);
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
