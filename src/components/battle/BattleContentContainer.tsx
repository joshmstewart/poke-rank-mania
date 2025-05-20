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
  initialSelectedGeneration = 0,
}) => {
  const {
    showingMilestone,
    rankingGenerated,
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    battleType,
    setBattleType,
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
    battleResults,
  } = useBattleStateCore();

  return (
    <div className="flex flex-col">
      <BattleControls
        selectedGeneration={selectedGeneration.toString()}
        battleType={battleType}
        onGenerationChange={(gen: string) => setSelectedGeneration(parseInt(gen))}
        onBattleTypeChange={(type) => setBattleType(type)}
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
        onNewBattleSet={() => startNewBattle(battleType)}
        onContinueBattles={() => setShowingMilestone(false)}
        onSaveRankings={() => generateRankings(battleResults)}
        isProcessing={isProcessingResult}
      />
    </div>
  );
};

export default BattleContentContainer;
