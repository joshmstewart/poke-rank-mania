
import React, { useEffect, useRef } from "react";
import { Pokemon, TopNOption } from "@/services/pokemon";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import BattleInterface from "./BattleInterface";
import BattleHeader from "./BattleHeader";
import BattleControls from "./BattleControls";
import BattleFooterNote from "./BattleFooterNote";
import { BattleType } from "@/hooks/battle/types";
import RankingDisplay from "./RankingDisplay";
import ProgressTracker from "./ProgressTracker";
import TierSelector from "./TierSelector";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
}

const BattleContent = ({ allPokemon, initialBattleType, initialSelectedGeneration }: BattleContentProps) => {
  const battleStartedRef = useRef(false);
  const previousBattlesCompletedRef = useRef(0);
  
  const {
    currentBattle,
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
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    processorRefs,
    battleHistory,
    activeTier,
    setActiveTier
  } = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  // Only call startNewBattle once when the component mounts and allPokemon is available
  useEffect(() => {
    if (allPokemon.length > 0 && !battleStartedRef.current) {
      console.log("BattleContent: Starting new battle on initial load");
      battleStartedRef.current = true;
      startNewBattle(initialBattleType);
    }
  }, [allPokemon.length, initialBattleType, startNewBattle]);
  
  // Keep track of battles completed to prevent resetting
  useEffect(() => {
    previousBattlesCompletedRef.current = battlesCompleted;
  }, [battlesCompleted]);

  // Calculate remaining battles
  const getBattlesRemaining = () => {
    const totalBattlesNeeded = Math.floor(allPokemon.length * Math.log2(allPokemon.length));
    return Math.max(0, totalBattlesNeeded - battlesCompleted);
  };

  const handleBattleTypeChange = (newType: BattleType) => {
    setBattleType(newType);
    startNewBattle(newType);
    resetMilestones();
    localStorage.setItem('pokemon-ranker-battle-type', newType);
  };

  const handleGenerationChange = (generation: string) => {
    const genId = parseInt(generation, 10);
    setSelectedGeneration(genId);
    localStorage.setItem('pokemon-ranker-generation', generation);
    resetMilestones();
    startNewBattle(battleType);
  };

  const handleRestartBattles = () => {
    resetMilestones();
    startNewBattle(battleType);
  };

  const handleContinueBattles = () => {
    setShowingMilestone(false);
    // Reset the milestone processing flag when continuing battles
    if (processorRefs?.resetMilestoneInProgress) {
      processorRefs.resetMilestoneInProgress();
    }
    startNewBattle(battleType);
  };

  const handleNewBattleSet = () => {
    resetMilestones();
    // Reset the milestone processing flag when starting a new battle set
    if (processorRefs?.resetMilestoneInProgress) {
      processorRefs.resetMilestoneInProgress();
    }
    startNewBattle(battleType);
  };

  const handleSaveRankings = () => {
    console.log("Rankings saved!");
    setShowingMilestone(false);
    // Reset the milestone processing flag after saving rankings
    if (processorRefs?.resetMilestoneInProgress) {
      processorRefs.resetMilestoneInProgress();
    }
  };

  const handleTierChange = (tier: TopNOption) => {
    console.log("Changing tier to:", tier);
    setActiveTier(tier);
    // No need to restart battles, just keep going with new tier focus
  };

  // Calculate completion percentage
  useEffect(() => {
    calculateCompletionPercentage();
  }, [battlesCompleted, calculateCompletionPercentage]);

  if (!allPokemon.length) {
    return <div className="flex justify-center items-center h-64">Loading Pokémon...</div>;
  }

  // Create a wrapper function for handleTripletSelectionComplete that doesn't take arguments
  const handleTripletSelectionWrapper = () => {
    handleTripletSelectionComplete();
  };

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <BattleHeader 
        battlesCompleted={battlesCompleted} 
        onGoBack={goBack}
        hasHistory={battleHistory && battleHistory.length > 0}
        isProcessing={isProcessingResult}
        internalProcessing={false}
      />
      
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <BattleControls
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={handleGenerationChange}
          onBattleTypeChange={handleBattleTypeChange}
          onRestartBattles={handleRestartBattles}
        />
        
        <div className="flex items-center justify-between gap-4">
          <ProgressTracker 
            completionPercentage={completionPercentage}
            battlesCompleted={battlesCompleted}
            getBattlesRemaining={getBattlesRemaining}
          />
          
          <TierSelector 
            activeTier={activeTier}
            onTierChange={handleTierChange}
          />
        </div>
      </div>
      
      {showingMilestone ? (
        <div className="w-full max-w-4xl">
          <RankingDisplay
            finalRankings={finalRankings}
            battlesCompleted={battlesCompleted}
            onContinueBattles={handleContinueBattles}
            onNewBattleSet={handleNewBattleSet}
            rankingGenerated={true}
            onSaveRankings={handleSaveRankings}
            isMilestoneView={true}
            activeTier={activeTier}
            onTierChange={handleTierChange}
          />
        </div>
      ) : (
        <BattleInterface
          currentBattle={currentBattle}
          selectedPokemon={selectedPokemon}
          onPokemonSelect={handlePokemonSelect}
          onTripletSelectionComplete={handleTripletSelectionWrapper}
          isProcessing={isProcessingResult}
          battleType={battleType}
          onGoBack={goBack}
          battlesCompleted={battlesCompleted}
          battleHistory={battleHistory || []}
          milestones={milestones}
        />
      )}
      
      <BattleFooterNote battlesCompleted={battlesCompleted} />
    </div>
  );
};

export default BattleContent;
