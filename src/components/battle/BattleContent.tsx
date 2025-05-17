import React, { useEffect, useState } from "react";
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
  // Keep track of internal state to handle transitions correctly
  const [internalShowRankings, setInternalShowRankings] = useState(showingMilestone || rankingGenerated);
  
  // Update internal state when external state changes
  useEffect(() => {
    console.log("BattleContent: props updated -", { 
      showingMilestone,
      rankingGenerated,
      battlesCompleted,
      finalRankingsLength: finalRankings?.length || 0
    });
    
    setInternalShowRankings(showingMilestone || rankingGenerated);
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings]);

  // Enhanced debug logging
  useEffect(() => {
    console.log("BattleContent rendering with state:", { 
      showingMilestone,
      rankingGenerated,
      battlesCompleted,
      internalShowRankings,
      finalRankingsLength: finalRankings?.length || 0,
      firstRankedPokemon: finalRankings?.[0]?.name || "None"
    });
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings, internalShowRankings]);

  // Custom continue battles handler that ensures state is updated correctly
  const handleContinueBattles = () => {
    console.log("BattleContent: handleContinueBattles called");
    setInternalShowRankings(false);
    // Use setTimeout to ensure state updates before calling the external handler
    setTimeout(() => {
      onContinueBattles();
    }, 50);
  };
  
  // Add debug log for component rendering decision
  console.log("BattleContent: shouldShowRankings =", internalShowRankings);
  
  if (internalShowRankings) {
    return (
      <RankingDisplay
        finalRankings={finalRankings || []}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onNewBattleSet={onNewBattleSet}
        onContinueBattles={handleContinueBattles}
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
