
import { useEffect, useRef, useState, useCallback } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";

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
  const milestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync the ref with the prop value - important to prevent stale ref values
  useEffect(() => {
    showingMilestoneRef.current = showingMilestone;
    
    // Clean up timeouts on unmount
    return () => {
      if (milestoneTimeoutRef.current) {
        clearTimeout(milestoneTimeoutRef.current);
      }
    };
  }, [showingMilestone]);

  // This effect is simplified to avoid causing render loops
  const checkForMilestones = useCallback(() => {
    const battleCount = battleResults.length;
    
    // Avoid processing if the battle count didn't change
    if (previousBattleCountRef.current === battleCount ||
        showingMilestoneRef.current || 
        isMilestoneProcessingRef.current) {
      return;
    }
    
    previousBattleCountRef.current = battleCount;
  }, [battleResults.length]);

  // Run the milestone check effect less frequently
  useEffect(() => {
    checkForMilestones();
  }, [battleResults.length, checkForMilestones]);

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
    // If we don't have rankings for this milestone yet, generate them
    if (!milestoneRankings[battleCount] && battleResults.length >= battleCount) {
      // Use the battle results up to this milestone
      const relevantResults = battleResults.slice(0, battleCount);
      const rankingsSnapshot = generateRankings(relevantResults);
      
      // Store the snapshot for this milestone
      if (rankingsSnapshot && rankingsSnapshot.length > 0) {
        setMilestoneRankings(prev => ({
          ...prev,
          [battleCount]: rankingsSnapshot
        }));
        
        return rankingsSnapshot;
      }
    }
    
    return milestoneRankings[battleCount] || [];
  }, [milestoneRankings, battleResults, generateRankings]);

  return { 
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  };
};
