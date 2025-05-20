
import React, { useEffect, useState, useMemo, useRef } from "react";
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
  const hasFetchedSnapshotRef = useRef<boolean>(false);
  const previousMilestoneRef = useRef<number>(-1);
  const isProcessingSnapshotRef = useRef<boolean>(false);

  // Only fetch milestone snapshot when the milestone flag changes to true
  useEffect(() => {
    // Guard against processing multiple times
    if (isProcessingSnapshotRef.current) return;
    
    // Only process if we have a milestone to show and haven't fetched it yet
    // or if the battle count has changed since the last fetch
    if (
      props.showingMilestone && 
      (!hasFetchedSnapshotRef.current || previousMilestoneRef.current !== props.battlesCompleted)
    ) {
      // Set processing flag to prevent multiple fetches
      isProcessingSnapshotRef.current = true;
      
      try {
        // Get cached rankings for the milestone
        const snapshot = getSnapshotForMilestone(props.battlesCompleted);
        if (snapshot && snapshot.length > 0) {
          // Use setTimeout to avoid state updates during rendering
          setTimeout(() => {
            setSnapshotRankings(snapshot);
            hasFetchedSnapshotRef.current = true;
            previousMilestoneRef.current = props.battlesCompleted;
            isProcessingSnapshotRef.current = false;
          }, 0);
        } else {
          isProcessingSnapshotRef.current = false;
        }
      } catch (error) {
        console.error("Error getting milestone snapshot:", error);
        isProcessingSnapshotRef.current = false;
      }
    } else if (!props.showingMilestone) {
      // Reset the flag when not showing milestone
      hasFetchedSnapshotRef.current = false;
    }
  }, [props.showingMilestone, props.battlesCompleted, getSnapshotForMilestone]);

  // Use memoized value to determine which rankings to show to avoid unnecessary renders
  const shouldShowRankings = useMemo(() => {
    return (props.showingMilestone && snapshotRankings.length > 0) || 
           (props.rankingGenerated && props.finalRankings && props.finalRankings.length > 0);
  }, [props.showingMilestone, props.rankingGenerated, snapshotRankings.length, props.finalRankings]);

  // Use memoized rankings to avoid unnecessary renders
  const rankingsToShow = useMemo(() => {
    return props.showingMilestone ? snapshotRankings : props.finalRankings;
  }, [props.showingMilestone, snapshotRankings, props.finalRankings]);

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

export default React.memo(BattleContent);
