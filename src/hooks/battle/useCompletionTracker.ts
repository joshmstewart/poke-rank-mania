
import { useEffect, useRef, useState, useCallback } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "@/services/pokemon";

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  showingMilestone: boolean,
  setShowingMilestone: (value: boolean) => void,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  allPokemon: any[]
) => {
  const hitMilestones = useRef(new Set<number>());
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const isMilestoneProcessingRef = useRef(false);
  const previousBattleCountRef = useRef<number>(0);
  const showingMilestoneRef = useRef<boolean>(showingMilestone);
  const percentageCalculationInProgressRef = useRef(false);
  const snapshotCacheRef = useRef<Record<number, RankedPokemon[]>>({});
  const snapshotGenerationInProgressRef = useRef<Record<number, boolean>>({});
  const lastCalculatedPercentageRef = useRef<number>(0);

  // Define milestones array locally to ensure consistency
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];

  useEffect(() => {
    showingMilestoneRef.current = showingMilestone;
  }, [showingMilestone]);

  // DISABLED: This hook was interfering with the main milestone detection
  // The milestone detection is now handled entirely by useBattleProgression
  const checkForMilestones = useCallback(() => {
    console.log("🔕 useCompletionTracker: Milestone checking disabled - handled by useBattleProgression");
  }, []);

  useEffect(() => {
    // Milestone checking is now disabled in this hook
    // All milestone detection is handled by useBattleProgression
  }, [battleResults.length, checkForMilestones]);

  const resetMilestones = useCallback(() => {
    console.log("🧹 Resetting milestones completely");
    hitMilestones.current.clear();
    setMilestoneRankings({});
    snapshotCacheRef.current = {};
    setShowingMilestone(false);
  }, [setShowingMilestone]);

  const resetMilestoneRankings = useCallback(() => {
    console.log("🧹 Resetting milestone rankings cache");
    setMilestoneRankings({});
    snapshotCacheRef.current = {};
  }, []);

  const calculateCompletionPercentage = useCallback(() => {
    if (!allPokemon || allPokemon.length === 0 || percentageCalculationInProgressRef.current) {
      return lastCalculatedPercentageRef.current;
    }

    percentageCalculationInProgressRef.current = true;

    try {
      const totalBattlesNeeded = Math.floor(allPokemon.length * Math.log2(allPokemon.length));
      const calculatedPercentage = battleResults.length === 0 ? 0 : Math.min(100, Math.max(1, 
        Math.floor((battleResults.length / totalBattlesNeeded) * 100)
      ));
      
      if (calculatedPercentage !== lastCalculatedPercentageRef.current) {
        console.log(`📈 Completion percentage updated: ${calculatedPercentage}%`);
        lastCalculatedPercentageRef.current = calculatedPercentage;
        setCompletionPercentage(calculatedPercentage);
      }

      return calculatedPercentage;
    } finally {
      setTimeout(() => {
        percentageCalculationInProgressRef.current = false;
      }, 200);
    }
  }, [allPokemon, battleResults.length, setCompletionPercentage]);

  const getSnapshotForMilestone = useCallback((battleCount: number): RankedPokemon[] => {
    console.log(`📸 getSnapshotForMilestone called for battleCount: ${battleCount}`);

    if (snapshotCacheRef.current[battleCount]) {
      console.log(`✅ Using cached snapshot for milestone ${battleCount}`);
      return snapshotCacheRef.current[battleCount];
    }

    if (snapshotGenerationInProgressRef.current[battleCount]) {
      console.log(`⏳ Snapshot already generating for milestone ${battleCount}`);
      return [];
    }

    if (battleResults.length >= battleCount) {
      if (isMilestoneProcessingRef.current) {
        console.log(`⚠️ Already processing another milestone, skipping ${battleCount}`);
        return [];
      }

      isMilestoneProcessingRef.current = true;
      snapshotGenerationInProgressRef.current[battleCount] = true;

      console.log(`🚩 Generating snapshot for milestone ${battleCount}`);

      try {
        const relevantResults = battleResults.slice(0, battleCount);
        console.log("🔵 useCompletionTracker: generating rankings snapshot");
        const rankingsSnapshot = generateRankings(relevantResults);

        if (rankingsSnapshot.length > 0) {
          snapshotCacheRef.current[battleCount] = rankingsSnapshot;
          setMilestoneRankings(prev => ({
            ...prev,
            [battleCount]: rankingsSnapshot
          }));

          console.log(`✅ Snapshot generated and stored for milestone ${battleCount}`);

          setTimeout(() => {
            isMilestoneProcessingRef.current = false;
            snapshotGenerationInProgressRef.current[battleCount] = false;
          }, 200);

          return rankingsSnapshot;
        }
      } catch (error) {
        console.error(`❌ Error generating snapshot at milestone ${battleCount}:`, error);
        isMilestoneProcessingRef.current = false;
        snapshotGenerationInProgressRef.current[battleCount] = false;
      }
    }

    console.log(`⚠️ No snapshot generated for milestone ${battleCount}`);
    return [];
  }, [battleResults, generateRankings]);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [calculateCompletionPercentage]);

  return {
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    milestoneRankings,
    hitMilestones,
  };
};
