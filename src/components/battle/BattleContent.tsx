import React, { useEffect, useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleInterface from "./BattleInterface";
import RankingDisplay from "./RankingDisplay";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore"; // ✅ make sure this is available

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

  // ✅ Pull in getSnapshotForMilestone
  const { getSnapshotForMilestone } = useBattleStateCore();
  const snapshotRankings = showingMilestone
    ? getSnapshotForMilestone(battlesCompleted) || []
    : [];

  const rankingsToShow = showingMilestone ? snapshotRankings : finalRankings;

  useEffect(() => {
    if (continuePressedRef.current) {
      setInternalShowRankings(false);
      continuePressedRef.current = false;
      return;
    }
    setInternalShowRankings(showingMilestone || rankingGenerated);
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings]);

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

  const handleContinueBattles = useCallback(() => {
    continuePressedRef.current = true;
    setInternalShowRankings(false);
    setTimeout(() => {
      onContinueBattles();
    }, 100);
  }, [onContinueBattles]);

  if (internalShowRankings) {
    return (
      <RankingDisplay
        finalRankings={rankingsToShow || []} // ✅ use the correct source: snapshot or live
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
