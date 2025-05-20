
import React, { useEffect, useState } from "react";
import { Pokemon } from "@/services/pokemon";
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
  battleType: any;
  battleHistory: any[];
  finalRankings: RankedPokemon[];
  milestones: number[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
  onNewBattleSet: () => void;
  onContinueBattles: () => void;
  onSaveRankings: () => void;
  isProcessing?: boolean;
}

const BattleContent: React.FC<BattleContentProps> = (props) => {
  const { getSnapshotForMilestone } = useBattleStateCore();
  const [snapshotRankings, setSnapshotRankings] = useState<RankedPokemon[]>([]);

  useEffect(() => {
    if (props.showingMilestone) {
      // Use try/catch to handle potential errors
      try {
        const snapshot = getSnapshotForMilestone(props.battlesCompleted);
        if (snapshot && snapshot.length > 0) {
          setSnapshotRankings(snapshot);
        } else {
          console.error("Empty or invalid snapshot received");
          // Don't automatically call onContinueBattles here to avoid render loops
        }
      } catch (error) {
        console.error("Error getting milestone snapshot:", error);
      }
    }
  }, [props.showingMilestone, props.battlesCompleted, getSnapshotForMilestone]);

  const rankingsToShow = snapshotRankings.length ? snapshotRankings : props.finalRankings;

  if ((props.showingMilestone || props.rankingGenerated) && rankingsToShow.length) {
    return (
      <RankingDisplay
        finalRankings={rankingsToShow}
        battlesCompleted={props.battlesCompleted}
        rankingGenerated={props.rankingGenerated}
        onNewBattleSet={props.onNewBattleSet}
        onContinueBattles={props.onContinueBattles}
        onSaveRankings={props.onSaveRankings}
        isMilestoneView={props.showingMilestone}
      />
    );
  }

  return <BattleInterface {...props} />;
};

export default BattleContent;
