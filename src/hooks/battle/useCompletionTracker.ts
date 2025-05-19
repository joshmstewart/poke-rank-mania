import { useState, useEffect, useRef } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  rankedPokemon: RankedPokemon[],
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const hitMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (battleResults.length > 0) {
      calculateCompletionPercentage();
      handleMilestoneSnapshot();
    }
  }, [battleResults.length]);

  const calculateCompletionPercentage = () => {
    const freshRankings = generateFreshRankings(rankedPokemon);

    if (!freshRankings || freshRankings.length === 0) {
      setCompletionPercentage(0);
      return;
    }

    const log2N = Math.log2(freshRankings.length);
    const confidences = freshRankings.map(p => Math.min(1, p.count / log2N));
    const percent = Math.round((confidences.reduce((a, b) => a + b, 0) / freshRankings.length) * 100);
    setCompletionPercentage(percent);

    const confidenceMap: Record<number, number> = {};
    freshRankings.forEach(p => {
      confidenceMap[p.id] = Math.round(Math.min(1, p.count / log2N) * 100);
    });
    setConfidenceScores(confidenceMap);

    if (percent >= 100 && !currentRankingGenerated && battleResults.length >= 50) {
      generateRankings(battleResults);
      setRankingGenerated(true);
      setCurrentRankingGenerated(true);
      toast({
        title: "Complete Ranking Achieved!",
        description: "You've completed enough battles to generate a full ranking of all Pokémon!",
        variant: "default"
      });
    }
  };

  const getBattlesRemaining = () => {
    const log2N = Math.log2(rankedPokemon.length || 1);
    return Math.max(0, Math.ceil(rankedPokemon.length * log2N) - battleResults.length);
  };

  const getConfidentRankedPokemon = (threshold = 0.5) => {
    const freshRankings = generateFreshRankings(rankedPokemon);
    const log2N = Math.log2(freshRankings.length || 1);
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    return freshRankings
      .filter(p => {
        const confidence = p.count / log2N;
        return p.count >= minAppearances && confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const lastMilestoneHit = Math.max(...MILESTONES.filter(m => m <= currentBattleCount));

    if (lastMilestoneHit && !hitMilestones.current.has(lastMilestoneHit)) {
      generateRankings(battleResults);

      setTimeout(() => {
        const confidentNow = getConfidentRankedPokemon(0.5);
        if (confidentNow.length > 0) {
          setMilestoneRankings(prev => ({
            ...prev,
            [lastMilestoneHit]: confidentNow
          }));
          hitMilestones.current.add(lastMilestoneHit);
          console.log(`📸 Milestone ${lastMilestoneHit} snapshot saved with ${confidentNow.length} Pokémon`);
        } else {
          console.warn(`⚠️ No confident Pokémon at milestone ${lastMilestoneHit}`);
        }
      }, 50);
    }
  };

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  const getOverallRankingProgress = () => {
    const values = Object.values(confidenceScores);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const resetMilestones = () => {
    hitMilestones.current = new Set();
    setMilestoneRankings({});
    setCurrentRankingGenerated(false);
    setConfidenceScores({});
    setCompletionPercentage(0);
  };

  // ✅ Injected helper: regenerates fresh ranking snapshot
  const generateFreshRankings = (base: RankedPokemon[]) => {
    return base
      .filter(p => typeof p.count === "number" && p.count > 0)
      .sort((a, b) => b.score - a.score);
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining,
    getConfidentRankedPokemon,
    getOverallRankingProgress,
    confidenceScores,
    getSnapshotForMilestone,
    resetMilestones
  };
};
