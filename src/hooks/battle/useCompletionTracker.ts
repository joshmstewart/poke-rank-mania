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

  const calculateCompletionPercentage = () => {
    const total = allPokemonForGeneration.length;
    const log2N = Math.log2(total || 1);
    const expectedCount = log2N * 2;
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    console.log("🧪 PROGRESS DEBUG:");
    console.log("Total filtered Pokémon:", total);
    console.log("Expected count threshold:", expectedCount.toFixed(2));
    console.log("Minimum appearances:", minAppearances);

    let confidentCount = 0;
    const confidenceMap: Record<number, number> = {};

    allPokemonForGeneration.forEach(p => {
      const ranked = rankedPokemon.find(r => r.id === p.id);
      const count = ranked?.count || 0;
      const confidence = count / expectedCount;

      if (count > 0) {
        console.log(`- ${p.name} (#${p.id}): count=${count}, confidence=${confidence.toFixed(2)}`);
      }

      if (count >= minAppearances && confidence >= CONFIDENCE_THRESHOLD) {
        console.log(`✅ ${p.name} qualifies`);
        confidentCount++;
      }

      if (count > 0) {
        confidenceMap[p.id] = Math.round(Math.min(1, confidence) * 100);
      }
    });

    const percent = total > 0 ? (confidentCount / total) * 100 : 0;
    setCompletionPercentage(parseFloat(percent.toFixed(2)));
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

  const getConfidentRankedPokemon = (threshold = CONFIDENCE_THRESHOLD) => {
    const total = allPokemonForGeneration.length;
    const expectedCount = Math.log2(total || 1) * 2;
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    return rankedPokemon
      .filter(p => {
        const confidence = p.count / expectedCount;
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
