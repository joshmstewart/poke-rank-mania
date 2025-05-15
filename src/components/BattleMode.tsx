
import React, { useState } from "react";
import { useBattleState } from "@/hooks/battle/useBattleState";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Import our components
import ProgressTracker from "./battle/ProgressTracker";
import BattleHeader from "./battle/BattleHeader";
import BattleSettings from "./battle/BattleSettings";
import BattleContent from "./battle/BattleContent";
import BattleFooterNote from "./battle/BattleFooterNote";
import ViewRankings from "./battle/ViewRankings";
import { Button } from "@/components/ui/button";
import { List, ChevronDown, ChevronUp } from "lucide-react";

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
        {/* Controls bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowViewRankings(true)}
            >
              <List className="h-4 w-4" /> View Rankings
            </Button>
          </div>
          
          {/* View settings toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1"
          >
            {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showSettings ? "Hide" : "Show"} Settings
          </Button>
        </div>

        {/* Collapsible settings section */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent>
            <div className="grid gap-4">
              {/* Battle settings */}
              <BattleSettings
                selectedGeneration={selectedGeneration}
                battleType={battleType}
                onGenerationChange={handleGenerationChange}
                onBattleTypeChange={handleBattleTypeChange}
              />

              {/* Progress tracker */}
              <ProgressTracker
                completionPercentage={completionPercentage}
                battlesCompleted={battlesCompleted}
                getBattlesRemaining={getBattlesRemaining}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Always show compact progress bar when settings are collapsed */}
        {!showSettings && (
          <div className="bg-white p-3 rounded-lg shadow border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                Gen: {selectedGeneration === 0 ? "All" : selectedGeneration}
              </span>
              <span className="text-sm font-medium">
                Mode: {battleType === "pairs" ? "Pairs" : "Trios"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Battles: {battlesCompleted}</span>
              <div className="w-32 bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs">{completionPercentage}%</span>
            </div>
          </div>
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
