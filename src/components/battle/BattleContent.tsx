
import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
  const processingRef = useRef(false);
  const prevShowingMilestone = useRef(false);
  const prevBattlesCompleted = useRef(-1);

  // Use memoized snapshot fetch to prevent unnecessary calls
  const fetchMilestoneSnapshot = useCallback(() => {
    // Prevent processing multiple times and avoid infinite loops
    if (processingRef.current) return;
    
    const { showingMilestone, battlesCompleted } = props;
    
    // Only process when milestone status changes from false to true
    // or when battle count changes while milestone is showing
    if (showingMilestone && 
        (!prevShowingMilestone.current || prevBattlesCompleted.current !== battlesCompleted)) {
      
      processingRef.current = true;
      console.log(`Fetching milestone snapshot for battle ${battlesCompleted}`);
      
      try {
        // Get cached rankings for the milestone with a delay
        setTimeout(() => {
          const snapshot = getSnapshotForMilestone(battlesCompleted);
          
          if (snapshot && snapshot.length > 0) {
            setSnapshotRankings(snapshot);
          }
          
          // Store current status to prevent refetching
          prevShowingMilestone.current = showingMilestone;
          prevBattlesCompleted.current = battlesCompleted;
          
          // Reset processing flag after a delay
          setTimeout(() => {
            processingRef.current = false;
          }, 100);
        }, 50);
      } catch (error) {
        console.error("Error getting milestone snapshot:", error);
        processingRef.current = false;
      }
    } else if (!showingMilestone) {
      // Update the tracking refs when milestone is closed
      prevShowingMilestone.current = false;
    }
  }, [props, getSnapshotForMilestone]);

  // Use effect to call fetch when needed
  useEffect(() => {
    if (props.showingMilestone && !processingRef.current) {
      fetchMilestoneSnapshot();
    }
  }, [props.showingMilestone, props.battlesCompleted, fetchMilestoneSnapshot]);

  // Memoize rankings logic to avoid unnecessary renders
  const shouldShowRankings = useMemo(() => {
    return (props.showingMilestone && snapshotRankings.length > 0) || 
           (props.rankingGenerated && props.finalRankings && props.finalRankings.length > 0);
  }, [props.showingMilestone, props.rankingGenerated, snapshotRankings.length, props.finalRankings]);

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
