
import React, { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import BattleInterface from "./BattleInterface";
import BattleHeader from "./BattleHeader";
import BattleControls from "./BattleControls";
import BattleFooterNote from "./BattleFooterNote";
import { BattleType } from "@/hooks/battle/types";
import RankingDisplay from "./RankingDisplay";
import ProgressTracker from "./ProgressTracker";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
}

const BattleContent = ({ allPokemon, initialBattleType, initialSelectedGeneration }: BattleContentProps) => {
  const battleStartedRef = useRef(false);
  
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
    generateRankings
  } = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  // Only call startNewBattle once when the component mounts and allPokemon is available
  useEffect(() => {
    if (allPokemon.length > 0 && !battleStartedRef.current) {
      console.log("BattleContent: Starting new battle on initial load");
      battleStartedRef.current = true;
      startNewBattle(initialBattleType);
    }
  }, [allPokemon.length, initialBattleType, startNewBattle]);
  
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
    startNewBattle(battleType);
  };

  const handleNewBattleSet = () => {
    resetMilestones();
    startNewBattle(battleType);
  };

  const handleSaveRankings = () => {
    console.log("Rankings saved!");
    setShowingMilestone(false);
  };

  // Calculate completion percentage
  useEffect(() => {
    calculateCompletionPercentage();
  }, [battlesCompleted, calculateCompletionPercentage]);

  if (!allPokemon.length) {
    return <div className="flex justify-center items-center h-64">Loading Pokémon...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <BattleHeader />
      
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={handleGenerationChange}
        onBattleTypeChange={handleBattleTypeChange}
        onRestartBattles={handleRestartBattles}
      />
      
      <div className="w-full max-w-3xl">
        <ProgressTracker 
          completionPercentage={completionPercentage}
          battlesCompleted={battlesCompleted}
          getBattlesRemaining={getBattlesRemaining}
        />
      </div>
      
      {showingMilestone ? (
        <div className="w-full max-w-3xl">
          <RankingDisplay
            finalRankings={finalRankings}
            battlesCompleted={battlesCompleted}
            onContinueBattles={handleContinueBattles}
            onNewBattleSet={handleNewBattleSet}
            rankingGenerated={true}
            onSaveRankings={handleSaveRankings}
            isMilestoneView={true}
          />
        </div>
      ) : (
        <BattleInterface
          currentBattle={currentBattle}
          selectedPokemon={selectedPokemon}
          onPokemonSelect={handlePokemonSelect}
          onTripletSelectionComplete={handleTripletSelectionComplete}
          isProcessing={isProcessingResult}
          battleType={battleType}
          onGoBack={goBack}
          battlesCompleted={battlesCompleted}
          battleHistory={[]}
          milestones={milestones}
        />
      )}
      
      <BattleFooterNote battlesCompleted={battlesCompleted} />
    </div>
  );
};

export default BattleContent;
