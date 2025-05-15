
import React, { useState } from "react";
import { useBattleState } from "@/hooks/battle/useBattleState";
import ViewRankings from "./battle/ViewRankings";
import BattleControls from "./battle/BattleControls";
import BattleDialogs from "./battle/BattleDialogs";
import BattleContentContainer from "./battle/BattleContentContainer";

const BattleMode = () => {
  const [showViewRankings, setShowViewRankings] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  
  const {
    isLoading,
    selectedGeneration,
    allPokemon,
    battleType,
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    rankingGenerated,
    finalRankings,
    battleHistory,
    showingMilestone,
    completionPercentage,
    milestones,
    handleGenerationChange,
    handleBattleTypeChange,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSaveRankings,
    handleContinueBattles,
    handleNewBattleSet,
    goBack,
    getBattlesRemaining,
    isProcessing
  } = useBattleState();

  const handleConfirmRestart = () => {
    handleGenerationChange(selectedGeneration.toString());
    setRestartDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading Pokémon...</p>
        </div>
      </div>
    );
  }

  if (showViewRankings) {
    return (
      <div className="container max-w-7xl mx-auto py-6">
        <ViewRankings 
          selectedGeneration={selectedGeneration}
          onClose={() => setShowViewRankings(false)}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        {/* Controls bar */}
        <BattleControls 
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={handleGenerationChange}
          onBattleTypeChange={handleBattleTypeChange}
          onViewRankings={() => setShowViewRankings(true)}
          onOpenRestartDialog={() => setRestartDialogOpen(true)}
        />

        {/* Dialogs */}
        <BattleDialogs 
          isRestartDialogOpen={restartDialogOpen}
          onRestartDialogChange={setRestartDialogOpen}
          onConfirmRestart={handleConfirmRestart}
        />

        {/* Battle content container with progress tracker and battle content */}
        <BattleContentContainer 
          completionPercentage={completionPercentage}
          battlesCompleted={battlesCompleted}
          getBattlesRemaining={getBattlesRemaining}
          showingMilestone={showingMilestone}
          rankingGenerated={rankingGenerated}
          currentBattle={currentBattle}
          selectedPokemon={selectedPokemon}
          battleType={battleType}
          battleHistory={battleHistory}
          finalRankings={finalRankings}
          milestones={milestones}
          onPokemonSelect={handlePokemonSelect}
          onTripletSelectionComplete={handleTripletSelectionComplete}
          onGoBack={goBack}
          onNewBattleSet={handleNewBattleSet}
          onContinueBattles={handleContinueBattles}
          onSaveRankings={handleSaveRankings}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default BattleMode;
