
import React, { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import BattleInterface from "./BattleInterface";
import BattleDialogs from "./BattleDialogs";
import BattleHeader from "./BattleHeader";
import BattleControls from "./BattleControls";
import BattleFooterNote from "./BattleFooterNote";
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

  // Only call startNewBattle in an effect if allPokemon changes
  useEffect(() => {
    if (allPokemon.length > 0) {
      console.log("BattleContent: Starting new battle on allPokemon change");
      startNewBattle(initialBattleType);
    }
  }, [allPokemon.length]); // Only dependency is allPokemon.length

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
    return <div className="flex justify-center items-center h-64">Loading Pokémon...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <BattleHeader />
      
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
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        isProcessing={isProcessingResult}
        battleType={battleType}
        onGoBack={goBack}
        battlesCompleted={battlesCompleted}
        battleHistory={[]}
        milestones={milestones}
      />
      
      <BattleFooterNote battlesCompleted={battlesCompleted} />
      
      <BattleDialogs
        showingMilestone={showingMilestone}
        onContinueBattles={() => setShowingMilestone(false)}
        onNewBattleSet={() => startNewBattle(battleType)}
      />
    </div>
  );
};

export default BattleContent;
