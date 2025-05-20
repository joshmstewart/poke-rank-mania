
import { useEffect, useRef, useState, useCallback } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  showingMilestone: boolean,
  setShowingMilestone: (value: boolean) => void,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  allPokemon: any[]
) => {
  // Use refs to track state without causing renders
  const hitMilestones = useRef(new Set<number>());
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const isMilestoneProcessingRef = useRef(false);
  const previousBattleCountRef = useRef<number>(0);
  const showingMilestoneRef = useRef<boolean>(showingMilestone);
  const percentageCalculationInProgressRef = useRef(false);
  const rankingGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotCacheRef = useRef<Record<number, RankedPokemon[]>>({});
  const snapshotGenerationInProgressRef = useRef<Record<number, boolean>>({});
  
  // Sync the ref with the prop value - important to prevent stale ref values
  useEffect(() => {
    showingMilestoneRef.current = showingMilestone;
    
    // Clean up timeouts on unmount
    return () => {
      if (rankingGenerationTimeoutRef.current) {
        clearTimeout(rankingGenerationTimeoutRef.current);
      }
    };
  }, [showingMilestone]);

  // A simplified effect to avoid causing render loops
  const checkForMilestones = useCallback(() => {
    const battleCount = battleResults.length;
    
    // Avoid processing if the battle count didn't change or milestones are already showing
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
    snapshotCacheRef.current = {};
  }, []);
  
  const resetMilestoneRankings = useCallback(() => {
    setMilestoneRankings({});
    snapshotCacheRef.current = {};
  }, []);
  
  const calculateCompletionPercentage = useCallback(() => {
    if (!allPokemon || allPokemon.length === 0 || percentageCalculationInProgressRef.current) return 0;
    
    percentageCalculationInProgressRef.current = true;
    
    try {
      const totalBattlesNeeded = allPokemon.length * Math.log2(allPokemon.length);
      const percentage = Math.min(100, Math.floor((battleResults.length / totalBattlesNeeded) * 100));
      
      // Only update if percentage changed, using a function to get the latest state
      setCompletionPercentage(prevPercentage => {
        if (prevPercentage !== percentage) {
          return percentage;
        }
        return prevPercentage;
      });
      
      return percentage;
    } finally {
      // Always reset the flag
      setTimeout(() => {
        percentageCalculationInProgressRef.current = false;
      }, 200);
    }
  }, [allPokemon, battleResults.length, setCompletionPercentage]);
  
  // Memoize this function to prevent it from causing render loops
  const getSnapshotForMilestone = useCallback((battleCount: number): RankedPokemon[] => {
    // First check if we have a cached snapshot
    if (snapshotCacheRef.current[battleCount]) {
      console.log(`Using cached snapshot for milestone: ${battleCount}`);
      return snapshotCacheRef.current[battleCount];
    }
    
    // Skip if already processing this milestone
    if (snapshotGenerationInProgressRef.current[battleCount]) {
      console.log(`Already generating snapshot for milestone: ${battleCount}`);
      return [];
    }
    
    // Only generate rankings if we have enough battle results
    if (battleResults.length >= battleCount) {
      // Mark as processing to prevent loops
      if (isMilestoneProcessingRef.current) {
        console.log("Already processing a milestone, returning empty rankings");
        return [];
      }
      
      isMilestoneProcessingRef.current = true;
      snapshotGenerationInProgressRef.current[battleCount] = true;
      
      console.log(`Generating snapshot for milestone: ${battleCount}`);
      
      try {
        // Use the battle results up to this milestone
        const relevantResults = battleResults.slice(0, battleCount);
        const rankingsSnapshot = generateRankings(relevantResults);
        
        // Store the snapshot in our cache immediately
        if (rankingsSnapshot && rankingsSnapshot.length > 0) {
          snapshotCacheRef.current[battleCount] = rankingsSnapshot;
          
          // Update state (this won't cause immediate re-render)
          setMilestoneRankings(prev => ({
            ...prev,
            [battleCount]: rankingsSnapshot
          }));
          
          // Return the snapshot immediately
          return rankingsSnapshot;
        }
      } catch (error) {
        console.error("Error generating snapshot for milestone:", error);
      } finally {
        // Release locks with a delay
        setTimeout(() => {
          isMilestoneProcessingRef.current = false;
          snapshotGenerationInProgressRef.current[battleCount] = false;
        }, 500);
      }
    }
    
    return snapshotCacheRef.current[battleCount] || [];
  }, [battleResults, generateRankings]);

  return { 
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  };
};
