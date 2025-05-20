import React from "react";
import BattleContent from "./BattleContent";
import BattleControls from "./BattleControls";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import { Pokemon } from "@/services/pokemon";

interface BattleContentContainerProps {
  allPokemon: Pokemon[];
  initialBattleType?: any;
  initialSelectedGeneration?: number;
}

const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  allPokemon,
  initialBattleType = "pairs",
  initialSelectedGeneration = 0
}) => {
  const {
    showingMilestone,
    rankingGenerated,
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    battleType,
    battleHistory,
    finalRankings,
    milestones,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    setSelectedGeneration,
    selectedGeneration,
    setShowingMilestone,
    isProcessingResult,
    generateRankings,
    startNewBattle,
    battleResults
  } = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  const handleGenerationChange = (generation: string) => {
    setSelectedGeneration(parseInt(generation, 10));
  };

  return (
    <div className="flex flex-col">
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={handleGenerationChange}
        onBattleTypeChange={startNewBattle}
      />
      <BattleContent
        showingMilestone={showingMilestone}
        rankingGenerated={rankingGenerated}
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        battleHistory={battleHistory}
        finalRankings={finalRankings}
        milestones={milestones}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        onGoBack={goBack}
        onNewBattleSet={() => startNewBattle()}
        onContinueBattles={() => setShowingMilestone(false)}
        onSaveRankings={() => generateRankings()}
        isProcessing={isProcessingResult}
      />
    </div>
  );
};

export default BattleContentContainer;
