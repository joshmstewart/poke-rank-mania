
import React from "react";
import BattleContentMain from "./BattleContentMain";
import BattleContentMilestone from "./BattleContentMilestone";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { Milestone } from "@/hooks/battle/useBattleMilestones";

interface BattleContentRendererProps {
  showingMilestone: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: any[];
  selectedGeneration: number;
  finalRankings: Pokemon[];
  activeTier: TopNOption;
  milestones: Milestone[];
  rankingGenerated: boolean;
  isAnyProcessing: boolean;
  setSelectedGeneration: React.Dispatch<React.SetStateAction<number>>;
  setBattleType: React.Dispatch<React.SetStateAction<BattleType>>;
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTier: React.Dispatch<React.SetStateAction<TopNOption>>;
  handlePokemonSelect: (pokemonId: number) => void;
  handleTripletSelectionComplete: () => void;
  goBack: () => void;
  handleContinueBattles: () => void;
  performFullBattleReset: () => void;
  handleSaveRankings: () => void;
  suggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  removeSuggestion: (pokemonId: number) => void;
  resetMilestoneInProgress: () => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<any[]>>;
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
  onRankingsUpdate,
  setBattlesCompleted,
  setBattleResults,
}) => {
  if (showingMilestone) {
    return (
      <BattleContentMilestone
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        activeTier={activeTier}
        getSnapshotForMilestone={() => ""}
        onContinueBattles={handleContinueBattles}
        performFullBattleReset={performFullBattleReset}
        handleSaveRankings={handleSaveRankings}
        setActiveTier={setActiveTier}
        suggestRanking={suggestRanking}
        removeSuggestion={removeSuggestion}
        setShowingMilestone={setShowingMilestone}
        resetMilestoneInProgress={resetMilestoneInProgress}
        handleManualReorder={handleManualReorder}
        onRankingsUpdate={onRankingsUpdate}
      />
    );
  } else {
    return (
      <BattleContentMain
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        isAnyProcessing={isAnyProcessing}
        battleHistory={battleHistory}
        onGoBack={goBack}
        milestones={milestones.map((m) => m.value)}
      />
    );
  }
};

export default BattleContentRenderer;
