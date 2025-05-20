
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
  // Destructure only the props we need for dependency arrays
  const { showingMilestone, battlesCompleted } = props;
  
  const { getSnapshotForMilestone } = useBattleStateCore();
  const [snapshotRankings, setSnapshotRankings] = useState<RankedPokemon[]>([]);
  const processingRef = useRef(false);
  const milestoneSnapshotFetchedRef = useRef(false);
  const prevShowingMilestone = useRef(showingMilestone);
  const prevBattlesCompleted = useRef(battlesCompleted);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);

  // Clean up any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the fetch function to prevent recreating it on every render
  const fetchMilestoneSnapshot = useCallback((battleCount: number) => {
    if (processingRef.current) {
      console.log("Already fetching milestone snapshot, skipping");
      return;
    }
    
    processingRef.current = true;
    console.log(`BattleContent: Fetching milestone snapshot for battle ${battleCount}`);
    
    try {
      const snapshot = getSnapshotForMilestone(battleCount);
      
      if (snapshot && snapshot.length > 0) {
        setSnapshotRankings(snapshot);
        milestoneSnapshotFetchedRef.current = true;
      } else {
        console.log("No snapshot available for milestone");
      }
    } catch (error) {
      console.error("Error getting milestone snapshot:", error);
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        processingRef.current = false;
      }, 500);
    }
  }, [getSnapshotForMilestone]);

  // Separate effect to track showingMilestone changes
  useEffect(() => {
    if (showingMilestone !== prevShowingMilestone.current) {
      prevShowingMilestone.current = showingMilestone;
      console.log(`Milestone visibility changed to: ${showingMilestone}`);
      
      // Reset fetched flag when milestone becomes hidden
      if (!showingMilestone) {
        milestoneSnapshotFetchedRef.current = false;
        // Clear any pending fetch
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = null;
        }
      }
    }
  }, [showingMilestone]);

  // Separate effect to handle milestone snapshot fetching
 useEffect(() => {
  if (showingMilestone && 
      !milestoneSnapshotFetchedRef.current && 
      !processingRef.current &&
      battlesCompleted > 0) {

    console.log("Milestone visible, fetching snapshot with delay");

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      if (milestoneSnapshotFetchedRef.current || processingRef.current) {
        console.log("🚫 Snapshot already fetched or in progress, skipping");
        return;
      }

      milestoneSnapshotFetchedRef.current = true;
      fetchMilestoneSnapshot(battlesCompleted);
      prevBattlesCompleted.current = battlesCompleted;
    }, 300);
  }
}, [showingMilestone, battlesCompleted, fetchMilestoneSnapshot]);


  // Memoize rankings logic to avoid unnecessary renders
  const shouldShowRankings = useMemo(() => {
    // We show rankings if:
    // 1. We're showing a milestone AND we have rankings (snapshot or final)
    // 2. OR final rankings are generated and available
    const showMilestone = showingMilestone && 
      (snapshotRankings.length > 0 || props.finalRankings.length > 0);
    const showFinal = props.rankingGenerated && props.finalRankings && props.finalRankings.length > 0;
    
    return showMilestone || showFinal;
  }, [
    showingMilestone, 
    props.rankingGenerated, 
    snapshotRankings.length, 
    props.finalRankings
  ]);

  // Memoize the rankings to show to avoid render loops
  const rankingsToShow = useMemo(() => {
    return showingMilestone && snapshotRankings.length > 0 ? 
      snapshotRankings : 
      props.finalRankings;
  }, [showingMilestone, snapshotRankings, props.finalRankings]);

  // Render RankingDisplay if we should show rankings
  if (shouldShowRankings) {
    return (
      <RankingDisplay
        finalRankings={rankingsToShow}
        battlesCompleted={battlesCompleted}
        rankingGenerated={props.rankingGenerated}
        onNewBattleSet={props.onNewBattleSet}
        onContinueBattles={props.onContinueBattles}
        onSaveRankings={props.onSaveRankings}
        isMilestoneView={showingMilestone}
      />
    );
  }

  // Otherwise render the battle interface
  return <BattleInterface {...props} />;
};

export default React.memo(BattleContent);
