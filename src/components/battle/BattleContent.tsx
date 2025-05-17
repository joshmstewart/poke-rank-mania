
import React, { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleInterface from "./BattleInterface";
import RankingDisplay from "./RankingDisplay";

interface BattleContentProps {
  showingMilestone: boolean;
  rankingGenerated: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
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

const BattleContent: React.FC<BattleContentProps> = ({
  showingMilestone,
  rankingGenerated,
  currentBattle,
  selectedPokemon,
  battlesCompleted,
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
  useEffect(() => {
    console.log("BattleContent rendering. showingMilestone:", showingMilestone, 
      "rankingGenerated:", rankingGenerated,
      "battlesCompleted:", battlesCompleted,
      "finalRankings length:", finalRankings?.length);
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings]);

  if (showingMilestone || rankingGenerated) {
    return (
      <RankingDisplay
        finalRankings={finalRankings}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onNewBattleSet={onNewBattleSet}
        onContinueBattles={onContinueBattles}
        onSaveRankings={onSaveRankings}
      />
    );
  } else {
    return (
      <BattleInterface
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battlesCompleted={battlesCompleted}
        battleType={battleType}
        battleHistory={battleHistory}
        onPokemonSelect={onPokemonSelect}
        onTripletSelectionComplete={onTripletSelectionComplete}
        onGoBack={onGoBack}
        milestones={milestones}
        isProcessing={isProcessing}
      />
    );
  }
};

export default BattleContent;
