
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
  // Enhanced debug logging
  useEffect(() => {
    console.log("BattleContent rendering with state:", { 
      showingMilestone,
      rankingGenerated,
      battlesCompleted,
      finalRankingsLength: finalRankings?.length || 0,
      firstRankedPokemon: finalRankings?.[0]?.name || "None"
    });
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings]);

  // Show ranking display if we're at a milestone or have generated rankings
  const shouldShowRankings = showingMilestone || rankingGenerated;
  
  // Add debug log for component rendering decision
  console.log("BattleContent: shouldShowRankings =", shouldShowRankings);
  
  if (shouldShowRankings) {
    return (
      <RankingDisplay
        finalRankings={finalRankings || []}
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
