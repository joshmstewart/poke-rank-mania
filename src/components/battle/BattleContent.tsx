
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
  const milestoneSnapshotFetchedRef = useRef(false);
  const prevShowingMilestone = useRef(props.showingMilestone);
  const prevBattlesCompleted = useRef(props.battlesCompleted);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);

  // Track render count to detect potential loops
  renderCountRef.current += 1;
  if (renderCountRef.current % 10 === 0) {
    console.log(`BattleContent rendered ${renderCountRef.current} times, milestone: ${props.showingMilestone}`);
  }

  // Clean up any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Use a stabilized fetch function to prevent render loops
  const fetchMilestoneSnapshot = useCallback((battleCount: number) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    console.log(`BattleContent: Fetching milestone snapshot for battle ${battleCount}`);
    
    try {
      const snapshot = getSnapshotForMilestone(battleCount);
      
      if (snapshot && snapshot.length > 0) {
        setSnapshotRankings(snapshot);
        milestoneSnapshotFetchedRef.current = true;
      }
    } catch (error) {
      console.error("Error getting milestone snapshot:", error);
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        processingRef.current = false;
      }, 300);
    }
  }, [getSnapshotForMilestone]);

  // Use useEffect to respond to milestone changes rather than doing it in render
  useEffect(() => {
    const { showingMilestone, battlesCompleted } = props;
    
    // Only process when milestone becomes visible
    if (showingMilestone && !prevShowingMilestone.current) {
      console.log("Milestone became visible, fetching snapshot");
      
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Get cached rankings for the milestone with a delay
      fetchTimeoutRef.current = setTimeout(() => {
        fetchMilestoneSnapshot(battlesCompleted);
        prevShowingMilestone.current = showingMilestone;
        prevBattlesCompleted.current = battlesCompleted;
      }, 300);
    } else if (!showingMilestone && prevShowingMilestone.current) {
      // Reset when milestone is hidden
      console.log("Milestone became hidden, resetting state");
      prevShowingMilestone.current = false;
      milestoneSnapshotFetchedRef.current = false;
    }
  }, [props.showingMilestone, props.battlesCompleted, fetchMilestoneSnapshot]);

  // Memoize rankings logic to avoid unnecessary renders
  const shouldShowRankings = useMemo(() => {
    const showMilestone = props.showingMilestone && (snapshotRankings.length > 0 || props.finalRankings.length > 0);
    const showFinal = props.rankingGenerated && props.finalRankings && props.finalRankings.length > 0;
    return showMilestone || showFinal;
  }, [props.showingMilestone, props.rankingGenerated, snapshotRankings.length, props.finalRankings]);

  const rankingsToShow = useMemo(() => {
    return props.showingMilestone && snapshotRankings.length > 0 ? 
      snapshotRankings : 
      props.finalRankings;
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
