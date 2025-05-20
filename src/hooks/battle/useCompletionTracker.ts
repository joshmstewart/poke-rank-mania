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
  const hitMilestones = useRef(new Set<number>());
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const isMilestoneProcessingRef = useRef(false);
  const previousBattleCountRef = useRef<number>(0);
  const showingMilestoneRef = useRef<boolean>(showingMilestone);
  const percentageCalculationInProgressRef = useRef(false);
  const snapshotCacheRef = useRef<Record<number, RankedPokemon[]>>({});
  const snapshotGenerationInProgressRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    showingMilestoneRef.current = showingMilestone;
  }, [showingMilestone]);

  const checkForMilestones = useCallback(() => {
    console.log("🔎 Checking milestones", {
      battleResultsLength: battleResults.length,
      previousCount: previousBattleCountRef.current,
      showingMilestone: showingMilestoneRef.current,
      processingMilestone: isMilestoneProcessingRef.current,
    });

    const battleCount = battleResults.length;

    if (previousBattleCountRef.current === battleCount ||
        showingMilestoneRef.current || 
        isMilestoneProcessingRef.current) {
      console.log("🚫 Skipped milestone check (no change or already processing)");
      return;
    }

    previousBattleCountRef.current = battleCount;
  }, [battleResults.length]);

  useEffect(() => {
    checkForMilestones();
  }, [battleResults.length, checkForMilestones]);

  const resetMilestones = useCallback(() => {
    console.log("🧹 Resetting milestones completely");
    hitMilestones.current.clear();
    setMilestoneRankings({});
    snapshotCacheRef.current = {};
  }, []);

  const resetMilestoneRankings = useCallback(() => {
    console.log("🧹 Resetting milestone rankings cache");
    setMilestoneRankings({});
    snapshotCacheRef.current = {};
  }, []);

  const calculateCompletionPercentage = useCallback(() => {
    if (!allPokemon || allPokemon.length === 0 || percentageCalculationInProgressRef.current) return 0;

    percentageCalculationInProgressRef.current = true;

    try {
      const totalBattlesNeeded = allPokemon.length * Math.log2(allPokemon.length);
      const percentage = Math.min(100, Math.floor((battleResults.length / totalBattlesNeeded) * 100));

      setCompletionPercentage(prev => {
        if (prev !== percentage) {
          console.log(`📈 Completion percentage updated: ${percentage}%`);
          return percentage;
        }
        return prev;
      });

      return percentage;
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

  return { 
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  };
};
