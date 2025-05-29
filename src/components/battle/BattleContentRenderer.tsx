
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import BattleContentHeader from "./BattleContentHeader";
import BattleContentMain from "./BattleContentMain";
import BattleContentMilestone from "./BattleContentMilestone";
import BattleContentLoading from "./BattleContentLoading";

interface BattleContentRendererProps {
  // State data
  showingMilestone: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  selectedGeneration: number;
  finalRankings: any[];
  activeTier: string;
  milestones: number[];
  rankingGenerated: boolean;
  isAnyProcessing: boolean;
  
  // Event handlers
  setSelectedGeneration: (gen: number) => void;
  setBattleType: (type: BattleType) => void;
  setShowingMilestone: (show: boolean) => void;
  setActiveTier: (tier: string) => void;
  handlePokemonSelect: (id: number) => void;
  handleTripletSelectionComplete: () => void;
  goBack: () => void;
  handleContinueBattles: () => void;
  performFullBattleReset: () => void;
  handleSaveRankings: () => void;
  suggestRanking: any;
  removeSuggestion: any;
  resetMilestoneInProgress: () => void;
  handleManualReorder: any;
  
  // Optional parent props
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContentRenderer: React.FC<BattleContentRendererProps> = ({
  showingMilestone,
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  selectedGeneration,
  finalRankings,
  activeTier,
  milestones,
  rankingGenerated,
  isAnyProcessing,
  setSelectedGeneration,
  setBattleType,
  setShowingMilestone,
  setActiveTier,
  handlePokemonSelect,
  handleTripletSelectionComplete,
  goBack,
  handleContinueBattles,
  performFullBattleReset,
  handleSaveRankings,
  suggestRanking,
  removeSuggestion,
  resetMilestoneInProgress,
  handleManualReorder,
  setBattlesCompleted,
  setBattleResults
}) => {
  console.log(`🔧 [BATTLE_CONTENT_RENDERER] Render decision - showingMilestone: ${showingMilestone}, currentBattle: ${currentBattle?.length || 0}`);

  // Show milestone screen
  if (showingMilestone) {
    return (
      <BattleContentMilestone
        finalRankings={finalRankings}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        activeTier={activeTier}
        getSnapshotForMilestone={() => JSON.stringify({ battlesCompleted, finalRankings })}
        onContinueBattles={handleContinueBattles}
        performFullBattleReset={performFullBattleReset}
        handleSaveRankings={handleSaveRankings}
        setActiveTier={setActiveTier}
        suggestRanking={suggestRanking}
        removeSuggestion={removeSuggestion}
        setShowingMilestone={setShowingMilestone}
        resetMilestoneInProgress={resetMilestoneInProgress}
        handleManualReorder={handleManualReorder}
        pendingRefinements={new Set<number>()}
      />
    );
  }

  // Show loading when no battle data
  if (!currentBattle || currentBattle.length === 0) {
    console.log(`🔧 [BATTLE_CONTENT_RENDERER] Showing loading - no battle data`);
    return <BattleContentLoading />;
  }

  // Show main interface
  console.log(`🔧 [BATTLE_CONTENT_RENDERER] Showing main interface with ${currentBattle.length} Pokemon`);
  
  return (
    <div className="w-full">
      <BattleContentHeader
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={setSelectedGeneration}
        setBattleType={setBattleType}
        performFullBattleReset={performFullBattleReset}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
      />

      <BattleContentMain
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        battleHistory={battleHistory}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        onGoBack={goBack}
        milestones={milestones}
        isAnyProcessing={isAnyProcessing}
      />
    </div>
  );
};

export default BattleContentRenderer;
