
import React, { useState, useMemo, useRef, useCallback } from "react";
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
  const prevPropsRef = useRef({
    showingMilestone: false,
    battlesCompleted: -1
  });
  const processingRef = useRef(false);

  // Extract milestone snapshot with useCallback to avoid recreating on every render
  const fetchMilestoneSnapshot = useCallback(() => {
    // Guard against processing multiple times and infinite loops
    if (processingRef.current) return;
    
    const { showingMilestone, battlesCompleted } = props;
    const prevProps = prevPropsRef.current;
    
    // Only process when milestone status actually changes or battle count changes
    if (showingMilestone && 
        (!prevProps.showingMilestone || prevProps.battlesCompleted !== battlesCompleted)) {
      
      processingRef.current = true;
      
      try {
        // Get cached rankings for the milestone
        const snapshot = getSnapshotForMilestone(battlesCompleted);
        
        if (snapshot && snapshot.length > 0) {
          // Update the state with rankings
          setSnapshotRankings(snapshot);
        }
      } catch (error) {
        console.error("Error getting milestone snapshot:", error);
      }
      
      // Store current props to prevent duplicate processing
      prevPropsRef.current = {
        showingMilestone,
        battlesCompleted
      };
      
      // Reset processing flag
      processingRef.current = false;
    } else if (!showingMilestone) {
      // Update the ref when milestone is closed
      prevPropsRef.current = {
        showingMilestone: false,
        battlesCompleted: prevProps.battlesCompleted
      };
    }
  }, [props, getSnapshotForMilestone]);

  // Call the fetch function once per render when needed
  React.useEffect(() => {
    if (props.showingMilestone) {
      fetchMilestoneSnapshot();
    }
  }, [props.showingMilestone, props.battlesCompleted, fetchMilestoneSnapshot]);

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
