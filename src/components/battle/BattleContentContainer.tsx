
import React from "react";
import ProgressTracker from "./ProgressTracker";
import BattleContent from "./BattleContent";
import BattleFooterNote from "./BattleFooterNote";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";

interface BattleContentContainerProps {
  completionPercentage: number;
  battlesCompleted: number;
  getBattlesRemaining: () => number;
  showingMilestone: boolean;
  rankingGenerated: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  finalRankings: Pokemon[];
  milestones: number[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
  onNewBattleSet: () => void;
  onContinueBattles: () => void;
  onSaveRankings: () => void;
  isProcessing?: boolean;
}

const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  completionPercentage,
  battlesCompleted,
  getBattlesRemaining,
  showingMilestone,
  rankingGenerated,
  currentBattle,
  selectedPokemon,
  battleType,
  battleHistory,
  finalRankings,
  milestones,
  onPokemonSelect,
  onTripletSelectionComplete,
  onGoBack,
  onNewBattleSet,
  onContinueBattles,
  onSaveRankings,
  isProcessing = false
}) => {
  return (
    <>
      {/* Progress tracker - completely separate from milestone ranking display */}
      <ProgressTracker
        completionPercentage={completionPercentage}
        battlesCompleted={battlesCompleted}
        getBattlesRemaining={getBattlesRemaining}
      />

      {/* Battle content */}
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
        onPokemonSelect={onPokemonSelect}
        onTripletSelectionComplete={onTripletSelectionComplete}
        onGoBack={onGoBack}
        onNewBattleSet={onNewBattleSet}
        onContinueBattles={onContinueBattles}
        onSaveRankings={onSaveRankings}
        isProcessing={isProcessing}
      />

      <BattleFooterNote battlesCompleted={battlesCompleted} />
    </>
  );
};

export default BattleContentContainer;
