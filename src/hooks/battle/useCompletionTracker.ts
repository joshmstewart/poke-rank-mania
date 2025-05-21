
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
      // Use a logarithmic formula to determine how many battles are needed for a good ranking
      // The more Pokemon, the more battles we need, but it grows slower than linear
      const totalBattlesNeeded = Math.floor(allPokemon.length * Math.log2(allPokemon.length));
      
      // Calculate percentage with a small minimum to show progress from the start
      // Only show percentage > 0 if there are actual battles completed
      const calculatedPercentage = battleResults.length === 0 ? 0 : Math.min(100, Math.max(1, 
        Math.floor((battleResults.length / totalBattlesNeeded) * 100)
      ));
      
      // Only update if the percentage has actually changed
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

  // Force an initial calculation of completion percentage when the tracker mounts
  useEffect(() => {
    calculateCompletionPercentage();
  }, [calculateCompletionPercentage]);

  return { 
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  };
};
