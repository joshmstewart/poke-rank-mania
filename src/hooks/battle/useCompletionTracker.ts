import { useState, useEffect, useRef } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  rankedPokemon: RankedPokemon[],
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  allPokemonForGeneration: Pokemon[]
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
    const totalPokemon = allPokemonForGeneration.length;
    if (totalPokemon === 0) {
      setCompletionPercentage(0);
      return;
    }

    const log2N = Math.log2(totalPokemon);
    const confidenceMap: Record<number, number> = {};
    let totalConfidence = 0;

    allPokemonForGeneration.forEach(p => {
      const matched = rankedPokemon.find(r => r.id === p.id);
      const count = matched?.count || 0;
      const confidence = Math.min(1, count / log2N);
      confidenceMap[p.id] = Math.round(confidence * 100);
      totalConfidence += confidence;
    });

    const percent = Math.round((totalConfidence / totalPokemon) * 100);
    setCompletionPercentage(percent);
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

  const getConfidentRankedPokemon = (threshold = 0.5) => {
    const log2N = Math.log2(allPokemonForGeneration.length || 1);
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    return rankedPokemon
      .filter(p => {
        const confidence = p.count / log2N;
        return p.count >= minAppearances && confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) return;

    generateRankings(battleResults);

    setTimeout(() => {
      const confidentNow = getConfidentRankedPokemon(0.5);
      setMilestoneRankings(prev => ({
        ...prev,
        [milestoneHit]: confidentNow
      }));
      hitMilestones.current.add(milestoneHit);

      console.log(`📸 Milestone ${milestoneHit} snapshot saved with ${confidentNow.length} Pokémon`);
    }, 100);
  };

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  const getBattlesRemaining = () => {
    const log2N = Math.log2(allPokemonForGeneration.length || 1);
    return Math.max(0, Math.ceil(allPokemonForGeneration.length * log2N) - battleResults.length);
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

  return {
    calculateCompletionPercentage,
    getBattlesRemaining,
    getConfidentRankedPokemon,
    getOverallRankingProgress,
    confidenceScores,
    getSnapshotForMilestone,
    resetMilestones
  };
};
