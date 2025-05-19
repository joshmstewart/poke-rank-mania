import { useState, useEffect } from "react";
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

  useEffect(() => {
    calculateCompletionPercentage();
    handleMilestoneSnapshot();
  }, [battleResults?.length]);

  const calculateCompletionPercentage = () => {
    const log2N = Math.log2(rankedPokemon.length || 1);
    const confidences = rankedPokemon.map(p => Math.min(1, p.count / log2N));
    const percent = Math.round((confidences.reduce((a, b) => a + b, 0) / (rankedPokemon.length || 1)) * 100);

    setCompletionPercentage(percent);

    const confidenceMap: Record<number, number> = {};
    rankedPokemon.forEach(p => {
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
    const log2N = Math.log2(rankedPokemon.length || 1);
    const minAppearances = Math.floor(Math.log2(battleResults.length || 1)) + 1;

    return rankedPokemon
      .filter(p => {
        const confidence = p.count / log2N;
        return p.count >= minAppearances && confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const lastMilestoneHit = Math.max(...MILESTONES.filter(m => m <= currentBattleCount));
    if (lastMilestoneHit && !milestoneRankings[lastMilestoneHit]) {
      const confidentNow = getConfidentRankedPokemon(0.5); // was 0.8 — this makes milestone snapshots more forgiving
      setMilestoneRankings(prev => ({
        ...prev,
        [lastMilestoneHit]: confidentNow
      }));
    }
  };

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  const getOverallRankingProgress = () => {
    return Object.values(confidenceScores).reduce((a, b) => a + b, 0) / (Object.keys(confidenceScores).length || 1);
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining,
    getConfidentRankedPokemon,
    getOverallRankingProgress,
    confidenceScores,
    getSnapshotForMilestone
  };
};
