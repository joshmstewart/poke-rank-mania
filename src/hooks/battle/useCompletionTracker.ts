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

  // 🔵 OVERALL RANKING PROGRESS — full generation set
  const calculateCompletionPercentage = () => {
    const totalPokemon = allPokemonForGeneration.length;
    if (totalPokemon === 0) {
      setCompletionPercentage(0);
      return;
    }

    const log2N = Math.log2(totalPokemon);
    const confidenceMap: Record<number, number> = {};
    let totalConfidence = 0;
    let counted = 0;

    allPokemonForGeneration.forEach(p => {
      const matched = rankedPokemon.find(r => r.id === p.id);
      const count = matched?.count || 0;

      if (count > 0) {
        const confidence = Math.min(1, count / log2N);
        confidenceMap[p.id] = Math.round(confidence * 100);
        totalConfidence += confidence;
        counted++;
      }
    });

    const percent = counted > 0 ? (totalConfidence / totalPokemon) * 100 : 0;
    setCompletionPercentage(parseFloat(percent.toFixed(2))); // ✅ 2 decimal places
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

  // 🟢 MILESTONE DISPLAY FILTER — confident in relation to confident cohort
  const getConfidentRankedPokemon = (threshold = 0.5) => {
    const cohort = rankedPokemon.filter(p => p.count > 0);
    const log2Cohort = Math.log2(cohort.length || 1);
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    return cohort
      .filter(p => {
        const confidence = p.count / log2Cohort;
        return p.count >= minAppearances && confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);
  };

  // 🪪 Called when battle count reaches an exact milestone
  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) return;

    generateRankings(battleResults); // ensures rankedPokemon is up to date

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
