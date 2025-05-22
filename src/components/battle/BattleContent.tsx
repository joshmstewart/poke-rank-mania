import React from 'react';
import { BattleControls } from './BattleControls';
import { PairBattleUI } from './PairBattleUI';
import { TripletBattleUI } from './TripletBattleUI';
import { MilestoneDisplay } from './MilestoneDisplay';
import { useBattleStateCore } from '@/hooks/battle/useBattleStateCore';
import { BattleType } from '@/hooks/battle/types';

export const BattleContent = () => {
  const {
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
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSelection,
    goBack,
    isProcessingResult,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    battleHistory,
    handleContinueBattles,
    resetMilestoneInProgress,
    startNewBattle,
  } = useBattleStateCore();

  const handleGenerationChange = (gen: number) => {
    setSelectedGeneration(gen);
    startNewBattle();
  };

  const handleBattleTypeChange = (type: BattleType) => {
    setBattleType(type);
    startNewBattle();
  };

  return (
    <div className="battle-content-container">
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={handleGenerationChange}
        onBattleTypeChange={handleBattleTypeChange}
        completionPercentage={completionPercentage}
        battlesCompleted={battlesCompleted}
      />

      {showingMilestone ? (
        <MilestoneDisplay
          milestone={getSnapshotForMilestone(battlesCompleted)}
          battleHistory={battleHistory}
          onContinue={() => {
            handleContinueBattles();
            setShowingMilestone(false);
            resetMilestoneInProgress();
          }}
        />
      ) : battleType === 'pair' && selectedPokemon.length === 2 ? (
        <PairBattleUI
          pokemon={selectedPokemon}
          onSelect={(id) => handleSelection([id])}
          onGoBack={goBack}
          disabled={isProcessingResult}
        />
      ) : battleType === 'triplet' && selectedPokemon.length === 3 ? (
        <TripletBattleUI
          pokemon={selectedPokemon}
          onSelect={(ids) => handleTripletSelectionComplete(ids)}
          onGoBack={goBack}
          disabled={isProcessingResult}
        />
      ) : rankingGenerated ? (
        <div className="ranking-generated-notice">
          Rankings have been generated.
        </div>
      ) : (
        <div className="no-battle-selected">
          No battle currently available.
          <button onClick={() => startNewBattle()}>
            Start New Battle
          </button>
        </div>
      )}
    </div>
  );
};
