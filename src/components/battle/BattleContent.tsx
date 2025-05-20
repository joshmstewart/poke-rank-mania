
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

  // Only fetch milestone snapshot when the milestone flag changes to true
  useEffect(() => {
    if (props.showingMilestone) {
      try {
        // Get cached rankings for the milestone
        const snapshot = getSnapshotForMilestone(props.battlesCompleted);
        if (snapshot && snapshot.length > 0) {
          setSnapshotRankings(snapshot);
        }
      } catch (error) {
        console.error("Error getting milestone snapshot:", error);
      }
    } else {
      // Clear snapshot when not showing milestone
      setSnapshotRankings([]);
    }
  }, [props.showingMilestone, props.battlesCompleted, getSnapshotForMilestone]);

  // Use memoized rankings to avoid unnecessary renders
  const rankingsToShow = props.showingMilestone ? snapshotRankings : props.finalRankings;
  const shouldShowRankings = (props.showingMilestone || props.rankingGenerated) && 
    (rankingsToShow && rankingsToShow.length > 0);

  if (shouldShowRankings) {
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
