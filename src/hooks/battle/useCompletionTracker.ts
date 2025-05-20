
import { useEffect, useRef, useState, useCallback } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  showingMilestone: boolean,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  allPokemon: any[]
) => {
  const hitMilestones = useRef(new Set<number>());
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const isMilestoneProcessingRef = useRef(false);
  const previousBattleCountRef = useRef<number>(0);
  const pendingMilestoneRef = useRef<number | null>(null);
  const showingMilestoneRef = useRef<boolean>(showingMilestone);

  // Sync the ref with the prop value - important to prevent stale ref values
  useEffect(() => {
    showingMilestoneRef.current = showingMilestone;
  }, [showingMilestone]);

  // Only check for milestones when battleResults change and we're not already showing one
  useEffect(() => {
    const battleCount = battleResults.length;
    
    // Avoid processing if the battle count didn't change
    if (previousBattleCountRef.current === battleCount) {
      return;
    }
    previousBattleCountRef.current = battleCount;
    
    // Don't trigger if already showing milestone or processing one
    if (showingMilestoneRef.current || isMilestoneProcessingRef.current) {
      return;
    }
    
    // Check if this is a milestone battle count
    if (MILESTONES.includes(battleCount) && !hitMilestones.current.has(battleCount)) {
      // Prevent re-triggers while processing
      isMilestoneProcessingRef.current = true;
      pendingMilestoneRef.current = battleCount;
      
      // Record this milestone as hit
      hitMilestones.current.add(battleCount);
      
      try {
        // Generate rankings for this milestone
        const rankingsSnapshot = generateRankings(battleResults);
        
        if (rankingsSnapshot && rankingsSnapshot.length > 0) {
          // Update milestone rankings
          setMilestoneRankings(prev => ({...prev, [battleCount]: rankingsSnapshot}));
          
          // Use setTimeout to ensure state updates don't cascade
          setTimeout(() => {
            // Only set milestone flag if we're still processing the same milestone
            // and another milestone isn't already showing
            if (pendingMilestoneRef.current === battleCount && !showingMilestoneRef.current) {
              setShowingMilestone(true);
              // Wait a bit before resetting processing flags to avoid race conditions
              setTimeout(() => {
                isMilestoneProcessingRef.current = false;
                pendingMilestoneRef.current = null;
              }, 100);
            } else {
              isMilestoneProcessingRef.current = false;
              pendingMilestoneRef.current = null;
            }
          }, 100);
        } else {
          console.warn("Milestone snapshot was empty, skipping milestone.");
          isMilestoneProcessingRef.current = false;
          pendingMilestoneRef.current = null;
        }
      } catch (err) {
        console.error("Error generating rankings at milestone:", err);
        isMilestoneProcessingRef.current = false;
        pendingMilestoneRef.current = null;
      }
    }
  }, [battleResults, generateRankings, setShowingMilestone, showingMilestone]);

  const resetMilestones = useCallback(() => {
    hitMilestones.current.clear();
    setMilestoneRankings({});
  }, []);
  
  const resetMilestoneRankings = useCallback(() => {
    setMilestoneRankings({});
  }, []);
  
  const calculateCompletionPercentage = useCallback(() => {
    if (!allPokemon || allPokemon.length === 0) return 0;
    
    const totalBattlesNeeded = allPokemon.length * Math.log2(allPokemon.length);
    const percentage = Math.min(100, Math.floor((battleResults.length / totalBattlesNeeded) * 100));
    
    // Only update if percentage changed
    setCompletionPercentage(prevPercentage => {
      if (prevPercentage !== percentage) {
        return percentage;
      }
      return prevPercentage;
    });
    
    return percentage;
  }, [allPokemon, battleResults.length, setCompletionPercentage]);
  
  const getSnapshotForMilestone = useCallback((battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  }, [milestoneRankings]);

  return { 
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  };
};
