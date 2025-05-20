import React from "react";
import BattleContent from "./BattleContent";
import BattleControls from "./BattleControls";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

const BattleContentContainer: React.FC = () => {
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
    handleNewBattleSet,
    handleContinueBattles,
    handleSaveRankings,
    isProcessing,
  } = useBattleStateCore();

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
      {/* ✅ Removed extra Logo to eliminate duplication */}
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

      <BattleControls />
    </div>
  );
};

export default BattleContentContainer;
