import React, { useEffect, useState, useCallback, useRef } from "react";
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
  // Use a ref to track when we've handled the continue button press
  const continuePressedRef = useRef(false);
  
  // Update internal state when external state changes, with special handling for continue button press
  useEffect(() => {
    console.log("BattleContent: props updated -", { 
      showingMilestone,
      rankingGenerated,
      battlesCompleted,
      finalRankingsLength: finalRankings?.length || 0,
      continuePressedRef: continuePressedRef.current
    });
    
    // If continue was pressed, we prioritize showing the battle interface
    if (continuePressedRef.current) {
      setInternalShowRankings(false);
      continuePressedRef.current = false; // Reset the flag
      return;
    }
    
    // Otherwise, follow normal display logic
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

  // Custom continue battles handler with better state handling
  const handleContinueBattles = useCallback(() => {
    console.log("BattleContent: handleContinueBattles called");
    
    // Mark that we've handled the continue button press
    continuePressedRef.current = true;
    
    // First update our internal state
    setInternalShowRankings(false);
    
    // Use setTimeout with a bit longer delay to ensure state updates
    // before calling the external handler
    setTimeout(() => {
      console.log("BattleContent: Calling external continue handler");
      onContinueBattles();
    }, 100);
  }, [onContinueBattles]);
  
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
