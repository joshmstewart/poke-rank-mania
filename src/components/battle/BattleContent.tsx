import React, { useEffect, useState, useRef } from "react";
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
  const continuePressedRef = useRef(false);
  const { getSnapshotForMilestone } = useBattleStateCore();

  const [snapshotRankings, setSnapshotRankings] = useState<RankedPokemon[]>([]);

  useEffect(() => {
    if (showingMilestone) {
      const snapshot = getSnapshotForMilestone(battlesCompleted);
      if (snapshot.length === 0) {
        console.error(`Empty snapshot at milestone ${battlesCompleted}, continuing battles.`);
        onContinueBattles(); // continue automatically if snapshot empty
      } else {
        setSnapshotRankings(snapshot);
      }
    } else {
      setSnapshotRankings([]);
    }
  }, [showingMilestone, battlesCompleted, getSnapshotForMilestone, onContinueBattles]);

  const rankingsToShow = snapshotRankings.length ? snapshotRankings : finalRankings;

  const handleContinueBattles = () => {
    continuePressedRef.current = true;
    setSnapshotRankings([]);
    onContinueBattles();
  };

  if ((showingMilestone || rankingGenerated) && rankingsToShow.length) {
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
