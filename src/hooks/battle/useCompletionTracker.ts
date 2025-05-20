
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
  }, []);
  
  const resetMilestoneRankings = useCallback(() => {
    setMilestoneRankings({});
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
  
  const getSnapshotForMilestone = useCallback((battleCount: number): RankedPokemon[] => {
    // If we don't have rankings for this milestone yet, generate them
    if (!milestoneRankings[battleCount] && battleResults.length >= battleCount) {
      // Mark as processing to prevent loops
      if (isMilestoneProcessingRef.current) {
        console.log("Already processing a milestone, returning empty rankings");
        return [];
      }
      
      isMilestoneProcessingRef.current = true;
      
      try {
        console.log(`Generating snapshot for milestone: ${battleCount}`);
        
        // Clear any existing timeout
        if (rankingGenerationTimeoutRef.current) {
          clearTimeout(rankingGenerationTimeoutRef.current);
        }
        
        // Generate the rankings with a delay
        rankingGenerationTimeoutRef.current = setTimeout(() => {
          try {
            // Use the battle results up to this milestone
            const relevantResults = battleResults.slice(0, battleCount);
            const rankingsSnapshot = generateRankings(relevantResults);
            
            // Store the snapshot for this milestone
            if (rankingsSnapshot && rankingsSnapshot.length > 0) {
              setMilestoneRankings(prev => ({
                ...prev,
                [battleCount]: rankingsSnapshot
              }));
            }
          } catch (error) {
            console.error("Error in delayed ranking generation:", error);
          } finally {
            // Release lock after processing is truly done
            setTimeout(() => {
              isMilestoneProcessingRef.current = false;
              rankingGenerationTimeoutRef.current = null;
            }, 200);
          }
        }, 100);
        
        // Return what we have now (could be empty)
        return milestoneRankings[battleCount] || [];
      } catch (error) {
        console.error("Error generating snapshot for milestone:", error);
        setTimeout(() => {
          isMilestoneProcessingRef.current = false;
        }, 200);
        return [];
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
