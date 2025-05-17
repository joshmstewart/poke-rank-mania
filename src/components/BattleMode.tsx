
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

  // Create adapter functions to match the expected interface
  const handlePokemonSelectAdapter = (id: number) => {
    handlePokemonSelect(id, battleType, currentBattle);
  };

  const handleTripletSelectionCompleteAdapter = () => {
    handleTripletSelectionComplete(battleType, currentBattle);
  };

  const goBackAdapter = () => {
    goBack();
  };

  const handleGenerationChangeAdapter = (value: string) => {
    handleGenerationChange(value);
  };

  // Fix: Create a properly typed handleConfirmRestart that takes no arguments
  // This is a self-contained function that uses the current selectedGeneration value
  const handleConfirmRestart = () => {
    // Store the current selectedGeneration in a local variable to avoid the closure issue
    const currentGeneration = selectedGeneration?.toString() || "0";
    // Call the adapter with the current generation
    handleGenerationChange(currentGeneration);
    // Close the dialog
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
          onGenerationChange={handleGenerationChangeAdapter}
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
          onPokemonSelect={handlePokemonSelectAdapter}
          onTripletSelectionComplete={handleTripletSelectionCompleteAdapter}
          onGoBack={goBackAdapter}
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
