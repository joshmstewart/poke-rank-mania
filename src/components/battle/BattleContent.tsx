
import React from 'react';
import BattleControls from './BattleControls';
import PairBattleUI from './PairBattleUI';
import TripletBattleUI from './TripletBattleUI';
import MilestoneDisplay from './MilestoneDisplay';
import { useBattleStateCore } from '@/hooks/battle/useBattleStateCore';

export const BattleContent = () => {
  const {
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    currentBattle,
    battleType,
    setBattleType,
    handleSelection,
    handleTripletSelectionComplete,
    goBack,
    isProcessingResult,
    milestones,
    getSnapshotForMilestone,
    battleHistory,
    handleContinueBattles,
    resetMilestoneInProgress,
    startNewBattle,
  } = useBattleStateCore();

  const handleGenerationChange = (gen: number | string) => {
    const parsedGen = typeof gen === 'string' ? parseInt(gen, 10) || 0 : gen;
    setSelectedGeneration(parsedGen);
    startNewBattle(parsedGen, battleType);
  };

  const handleBattleTypeChange = (type: "pair" | "triplet") => {
    setBattleType(type);
    startNewBattle(selectedGeneration, type);
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
          milestone={getSnapshotForMilestone()}
          battleHistory={battleHistory}
          onContinue={() => {
            handleContinueBattles();
            setShowingMilestone(false);
            resetMilestoneInProgress();
          }}
        />
      ) : battleType === 'pair' && currentBattle.length === 2 ? (
        <PairBattleUI
          pokemon={currentBattle}
          onSelect={(id: number) => handleSelection([id])}
          onGoBack={goBack}
          disabled={isProcessingResult}
        />
      ) : battleType === 'triplet' && currentBattle.length === 3 ? (
        <TripletBattleUI
          pokemon={currentBattle}
          onSelect={handleTripletSelectionComplete}
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
          <button onClick={() => startNewBattle(selectedGeneration, battleType)}>
            Start New Battle
          </button>
        </div>
      )}
    </div>
  );
};

export default BattleContent;
