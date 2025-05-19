import { useState, useEffect, useRef } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];
const CONFIDENCE_THRESHOLD = 0.5;

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

  // 🔵 PROGRESS %: confident Pokémon / total filtered Pokémon
  const calculateCompletionPercentage = () => {
    const total = allPokemonForGeneration.length;
    const log2N = Math.log2(total || 1);
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    let confidentCount = 0;
    const confidenceMap: Record<number, number> = {};

    allPokemonForGeneration.forEach(p => {
      const ranked = rankedPokemon.find(r => r.id === p.id);
      const count = ranked?.count || 0;
      const confidence = count / log2N;

      if (count >= minAppearances && confidence >= CONFIDENCE_THRESHOLD) {
        confidentCount++;
      }

      if (count > 0) {
        confidenceMap[p.id] = Math.round(Math.min(1, confidence) * 100);
      }
    });

    const percent = total > 0 ? (confidentCount / total) * 100 : 0;
    setCompletionPercentage(parseFloat(percent.toFixed(2))); // show 2 decimal places
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

  // 🟢 MILESTONE SNAPSHOTS: confident Pokémon relative to confident group
  const getConfidentRankedPokemon = (threshold = CONFIDENCE_THRESHOLD) => {
    const cohort = rankedPokemon.filter(p => p.count >= Math.max(2, Math.floor(Math.log2(battleResults.length || 1))));
    const log2Cohort = Math.log2(cohort.length || 1);

    return cohort
      .filter(p => {
        const confidence = p.count / log2Cohort;
        return confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) return;

    generateRankings(battleResults);

    setTimeout(() => {
      const confidentNow = getConfidentRankedPokemon(CONFIDENCE_THRESHOLD);
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
