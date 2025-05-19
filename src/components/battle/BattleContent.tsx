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
  const [internalShowRankings, setInternalShowRankings] = useState(showingMilestone || rankingGenerated);
  const continuePressedRef = useRef(false);

  // ✅ Pull in milestone snapshot
  const { getSnapshotForMilestone } = useBattleStateCore();
  const snapshotRankings = showingMilestone ? getSnapshotForMilestone(battlesCompleted) || [] : [];
  const rankingsToShow = showingMilestone ? snapshotRankings : finalRankings;

  useEffect(() => {
    console.log("🎯 BattleContent update:");
    console.log("- showingMilestone:", showingMilestone);
    console.log("- snapshot length:", snapshotRankings.length);
    console.log("- continuePressedRef:", continuePressedRef.current);

    if (continuePressedRef.current) {
      setInternalShowRankings(false);
      continuePressedRef.current = false;
      return;
    }

    setInternalShowRankings(showingMilestone || rankingGenerated);
  }, [showingMilestone, rankingGenerated, battlesCompleted, finalRankings, snapshotRankings]);

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

  if (internalShowRankings) {
    console.log("🏆 Showing rankings with", rankingsToShow?.length || 0, "Pokémon");

    return (
      <RankingDisplay
        finalRankings={rankingsToShow || []}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onNewBattleSet={onNewBattleSet}
        onContinueBattles={handleContinueBattles}
        onSaveRankings={onSaveRankings}
      />
    );
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
