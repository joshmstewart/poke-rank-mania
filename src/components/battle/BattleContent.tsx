
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleInterface from "./BattleInterface";
import RankingDisplay from "./RankingDisplay";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";
import { RankedPokemon } from "@/hooks/battle/useRankings";

interface BattleContentProps {
  showingMilestone: boolean;
  rankingGenerated: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[]; selected: number[] }[];
  finalRankings: Pokemon[] | RankedPokemon[];
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
  const [internalShowRankings, setInternalShowRankings] = useState(showingMilestone || rankingGenerated);
  const continuePressedRef = useRef(false);

  // Get milestone snapshot (completely separate from completion percentage)
  const { getSnapshotForMilestone } = useBattleStateCore();
  
  // Get the proper milestone snapshot if we're showing a milestone
  const snapshotRankings = showingMilestone ? getSnapshotForMilestone(battlesCompleted) : [];
  
  // ✅ CRITICAL FIX: Only use snapshot rankings when showing milestone AND we have valid snapshot data
  const rankingsToShow = showingMilestone && snapshotRankings && snapshotRankings.length > 0 
    ? snapshotRankings 
    : finalRankings;

  // ✅ NEW: Check if we have valid rankings to display
  const hasValidRankingsToShow = rankingsToShow && Array.isArray(rankingsToShow) && rankingsToShow.length > 0;

  useEffect(() => {
    console.log("🎯 BattleContent update:");
    console.log("- showingMilestone:", showingMilestone);
    console.log("- snapshot length:", snapshotRankings?.length || 0);
    console.log("- continuePressedRef:", continuePressedRef.current);
    console.log("- finalRankings length:", finalRankings?.length || 0);
    console.log("- hasValidRankingsToShow:", hasValidRankingsToShow);

    if (continuePressedRef.current) {
      setInternalShowRankings(false);
      continuePressedRef.current = false;
      return;
    }

    setInternalShowRankings(showingMilestone || rankingGenerated);
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings, snapshotRankings, hasValidRankingsToShow]);

  const handleContinueBattles = useCallback(() => {
    console.log("➡️ Continue Battles clicked");
    continuePressedRef.current = true;
    setInternalShowRankings(false);

    setTimeout(() => {
      onContinueBattles();

      // Reset continue flag to prevent stuck behavior
      setTimeout(() => {
        continuePressedRef.current = false;
        console.log("🔁 continuePressedRef reset");
      }, 300);
    }, 100);
  }, [onContinueBattles]);

  // ✅ CRITICAL FIX: Never render RankingDisplay with empty rankings
  if (internalShowRankings && hasValidRankingsToShow) {
    console.log("🏆 Showing rankings, valid data confirmed:", rankingsToShow.length);
    
    return (
      <RankingDisplay
        finalRankings={rankingsToShow}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onNewBattleSet={onNewBattleSet}
        onContinueBattles={handleContinueBattles}
        onSaveRankings={onSaveRankings}
        isMilestoneView={showingMilestone}
      />
    );
  }
  
  // Fallback for empty rankings or no milestone data - prevent crash with empty snapshot
  if (internalShowRankings) {
    console.log("⚠️ Would show rankings, but no valid data available, showing BattleInterface instead");
  }

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
};

export default BattleContent;
