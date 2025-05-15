
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
import { List, RefreshCw, Settings } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const BattleMode = () => {
  const [showViewRankings, setShowViewRankings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
        {/* Controls bar with all primary actions on one row */}
        <div className="flex items-center bg-white p-3 rounded-lg shadow border">
          {/* Left side buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowViewRankings(true)}
            >
              <List className="h-4 w-4" /> View Rankings
            </Button>
            
            {/* Reset button */}
            <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" /> Restart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your current battle progress and rankings.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      handleGenerationChange(selectedGeneration.toString());
                      setRestartDialogOpen(false);
                    }}
                  >
                    Yes, restart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          {/* Center area for battle settings */}
          <div className="flex-1 px-4">
            {showSettings ? (
              <BattleSettings
                selectedGeneration={selectedGeneration}
                battleType={battleType}
                onGenerationChange={handleGenerationChange}
                onBattleTypeChange={handleBattleTypeChange}
              />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  Gen: {selectedGeneration === 0 ? "All" : selectedGeneration}
                </span>
                <span className="text-sm font-medium">
                  Mode: {battleType === "pairs" ? "Pairs" : "Trios"}
                </span>
              </div>
            )}
          </div>
          
          {/* Settings toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? "Hide" : "Show"} Settings
          </Button>
        </div>

        {/* Progress tracker */}
        <ProgressTracker
          completionPercentage={completionPercentage}
          battlesCompleted={battlesCompleted}
          getBattlesRemaining={getBattlesRemaining}
        />

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
