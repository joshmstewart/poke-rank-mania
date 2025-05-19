
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

  // ✅ Get milestone snapshot but completely separate from completion percentage
  const { getSnapshotForMilestone } = useBattleStateCore();
  
  // This is the key fix - we properly handle milestone vs. final rankings
  const snapshotRankings = showingMilestone ? getSnapshotForMilestone(battlesCompleted) : [];
  const rankingsToShow = showingMilestone && snapshotRankings.length > 0 
    ? snapshotRankings 
    : finalRankings;

  useEffect(() => {
    console.log("🎯 BattleContent update:");
    console.log("- showingMilestone:", showingMilestone);
    console.log("- snapshot length:", snapshotRankings.length);
    console.log("- continuePressedRef:", continuePressedRef.current);
    console.log("- finalRankings length:", finalRankings?.length || 0);

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
    console.log("🏆 showingMilestone:", showingMilestone);
    console.log("🏆 rankingGenerated:", rankingGenerated);

    return (
      <RankingDisplay
        finalRankings={rankingsToShow || []}
        battlesCompleted={battlesCompleted}
        rankingGenerated={rankingGenerated}
        onNewBattleSet={onNewBattleSet}
        onContinueBattles={handleContinueBattles}
        onSaveRankings={onSaveRankings}
        isMilestoneView={showingMilestone}
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
