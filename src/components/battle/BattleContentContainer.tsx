
import React from "react";
import BattleContent from "./BattleContent";
import BattleControls from "./BattleControls";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

const BattleContentContainer: React.FC = () => {
  const {
    selectedGeneration,
    battleType,
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    battleHistory,
    finalRankings,
    milestones,
    showingMilestone,
    rankingGenerated,
    isProcessing,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleContinueBattles,
    handleNewBattleSet,
    handleSaveRankings,
    handleGenerationChange,
    handleBattleTypeChange,
    goBack,
  } = useBattleStateCore();

  return (
    <div className="max-w-3xl mx-auto p-4">
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={handleGenerationChange}
        onBattleTypeChange={handleBattleTypeChange}
        onRestartBattles={handleNewBattleSet}
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
        onPokemonSelect={(id) => handlePokemonSelect(id, battleType, currentBattle)}
        onTripletSelectionComplete={() => handleTripletSelectionComplete(battleType, currentBattle)}
        onGoBack={goBack}
        onNewBattleSet={handleNewBattleSet}
        onContinueBattles={handleContinueBattles}
        onSaveRankings={handleSaveRankings}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default BattleContentContainer;
