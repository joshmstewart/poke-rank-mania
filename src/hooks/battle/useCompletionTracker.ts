import { useState, useEffect, useRef } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];
const CONFIDENCE_THRESHOLD = 0.15; // ✅ Lowered for earlier progress

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
  }, [battleResults.length, rankedPokemon]); // ✅ Ensure dependency on rankedPokemon

  const calculateCompletionPercentage = () => {
    const total = allPokemonForGeneration.length;
    const log2N = Math.log2(total || 1);
    const expectedCount = log2N * 1.25;
    const minAppearances = Math.min(4, Math.max(2, Math.floor(Math.log2(battleResults.length || 1))));

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

      if (count >= minAppearances || confidence >= CONFIDENCE_THRESHOLD) {
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
  const uniqueBattledPokemonCount = rankedPokemon.length;

  // Calculate average battle count per Pokémon actually seen
  const totalBattlesParticipated = rankedPokemon.reduce((sum, p) => sum + p.count, 0);
  const avgBattlesPerPokemon = totalBattlesParticipated / uniqueBattledPokemonCount;

  // Gradually scale up minimum required appearances
  let minAppearances = 1;
  if (uniqueBattledPokemonCount > 100) minAppearances = 4;
  else if (uniqueBattledPokemonCount > 50) minAppearances = 3;
  else if (uniqueBattledPokemonCount > 20) minAppearances = 2;

  console.log("🔍 Confidence calculation debug:");
  console.log("Unique Pokémon battled:", uniqueBattledPokemonCount);
  console.log("Average battles per Pokémon:", avgBattlesPerPokemon.toFixed(2));
  console.log("Min appearances for confidence:", minAppearances);

  return rankedPokemon
    .filter(p => {
      const confidence = p.count / avgBattlesPerPokemon;
      const qualifies = p.count >= minAppearances || confidence >= threshold;

      if (qualifies) {
        console.log(`✅ Pokémon ${p.name} (#${p.id}) qualifies: count=${p.count}, confidence=${confidence.toFixed(2)}`);
      }

      return qualifies;
    })
    .sort((a, b) => b.score - a.score);
};


  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) return;

    generateRankings(battleResults);

    // ✅ Updated snapshot logic to wait until rankings are ready
    const checkAndSnapshot = () => {
      const confidentNow = getConfidentRankedPokemon(CONFIDENCE_THRESHOLD);

      if (confidentNow.length === 0) {
        setTimeout(checkAndSnapshot, 50);
        return;
      }

      setMilestoneRankings(prev => ({
        ...prev,
        [milestoneHit]: confidentNow
      }));
      hitMilestones.current.add(milestoneHit);
      console.log(`📸 Milestone ${milestoneHit} snapshot saved with ${confidentNow.length} Pokémon`);
    };

    setTimeout(checkAndSnapshot, 100);
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
