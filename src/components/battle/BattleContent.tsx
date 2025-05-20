
import React, { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import { BattleInterface } from "./BattleInterface";
import BattleDialogs from "./BattleDialogs";
import { BattleHeader } from "./BattleHeader";
import { BattleControls } from "./BattleControls";
import { BattleFooterNote } from "./BattleFooterNote";
import { BattleType } from "@/hooks/battle/types";

interface BattleContentProps {
  allPokemon: Pokemon[];
  initialBattleType: BattleType;
  initialSelectedGeneration: number;
}

const BattleContent = ({ allPokemon, initialBattleType, initialSelectedGeneration }: BattleContentProps) => {
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

  useEffect(() => {
    if (allPokemon.length > 0) {
      startNewBattle(initialBattleType);
    }
  }, [allPokemon, initialBattleType, startNewBattle]);

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

  if (!allPokemon.length) {
    return <div>No Pokémon to battle!</div>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <BattleHeader
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        completionPercentage={completionPercentage}
      />
      
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={handleGenerationChange}
        onBattleTypeChange={handleBattleTypeChange}
        onRestartBattles={handleRestartBattles}
      />
      
      <BattleInterface
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        handlePokemonSelect={handlePokemonSelect}
        handleTripletSelectionComplete={handleTripletSelectionComplete}
        isProcessing={isProcessingResult}
        battleType={battleType}
        onGoBack={goBack}
      />
      
      <BattleFooterNote />
      
      <BattleDialogs
        showingMilestone={showingMilestone}
        setShowingMilestone={setShowingMilestone}
        rankingGenerated={rankingGenerated}
        finalRankings={finalRankings}
        milestones={milestones}
        battlesCompleted={battlesCompleted}
        getSnapshotForMilestone={getSnapshotForMilestone}
      />
    </div>
  );
};

export default BattleContent;
