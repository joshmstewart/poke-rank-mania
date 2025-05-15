
import React, { useState } from "react";
import { useBattleState } from "@/hooks/battle/useBattleState";

// Import our components
import ProgressTracker from "./battle/ProgressTracker";
import BattleHeader from "./battle/BattleHeader";
import BattleSettings from "./battle/BattleSettings";
import BattleContent from "./battle/BattleContent";
import BattleFooterNote from "./battle/BattleFooterNote";
import ViewRankings from "./battle/ViewRankings";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

const BattleMode = () => {
  const [showViewRankings, setShowViewRankings] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  
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
    fullRankingMode,
    setFullRankingMode,
    milestones,
    handleGenerationChange,
    handleBattleTypeChange,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSaveRankings,
    handleContinueBattles,
    handleNewBattleSet,
    goBack,
    getBattlesRemaining
  } = useBattleState();

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
        {/* Compact settings bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? "Hide" : "Show"} Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowViewRankings(true)}
            >
              <List className="h-4 w-4" /> View Rankings
            </Button>
          </div>
          
          {/* Simplified progress indicator for collapsed state */}
          {!showSettings && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Battles: <span className="font-semibold">{battlesCompleted}</span>
              </div>
              <div className="h-2 w-24 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-primary rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">{completionPercentage}% Complete</div>
            </div>
          )}
        </div>

        {/* Only show settings when expanded */}
        {showSettings && (
          <>
            <BattleSettings
              selectedGeneration={selectedGeneration}
              battleType={battleType}
              fullRankingMode={fullRankingMode}
              onGenerationChange={handleGenerationChange}
              onBattleTypeChange={handleBattleTypeChange}
              onRankingModeChange={setFullRankingMode}
            />

            {/* Overall completion progress */}
            <ProgressTracker
              completionPercentage={completionPercentage}
              battlesCompleted={battlesCompleted}
              getBattlesRemaining={getBattlesRemaining}
            />
          </>
        )}

        {/* Battle content is always shown */}
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
          onNewBattleSet={handleNewBattleSet}
          onContinueBattles={handleContinueBattles}
          onSaveRankings={handleSaveRankings}
        />

        <BattleFooterNote battlesCompleted={battlesCompleted} />
      </div>
    </div>
  );
};

export default BattleMode;
