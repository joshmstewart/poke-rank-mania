import { useState, useEffect, useRef } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];
const CONFIDENCE_THRESHOLD = 0.15;

export const useCompletionTracker = (
  rankedPokemon: RankedPokemon[],
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[], // ← updated type
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
  }, [battleResults.length, rankedPokemon]);

  const calculateCompletionPercentage = () => {
    const uniquePokemonCount = rankedPokemon.length;
    const totalParticipations = rankedPokemon.reduce((sum, p) => sum + p.count, 0);
    const avgParticipations = totalParticipations / uniquePokemonCount || 1;

    let confidentCount = 0;
    const confidenceMap: Record<number, number> = {};

    rankedPokemon.forEach(p => {
      const confidence = p.count / avgParticipations;
      if (confidence >= CONFIDENCE_THRESHOLD) confidentCount++;
      confidenceMap[p.id] = Math.round(Math.min(1, confidence) * 100);
    });

    const percent = uniquePokemonCount > 0 ? (confidentCount / uniquePokemonCount) * 100 : 0;
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

  const getConfidentRankedPokemon = (
    currentRankedPokemon: RankedPokemon[],
    threshold = CONFIDENCE_THRESHOLD
  ) => {
    const uniquePokemonCount = currentRankedPokemon.length;
    const totalParticipations = currentRankedPokemon.reduce((sum, p) => sum + p.count, 0);
    const avgParticipations = totalParticipations / uniquePokemonCount || 1;

    let minAppearances = 1;
    if (uniquePokemonCount > 100) minAppearances = 4;
    else if (uniquePokemonCount > 50) minAppearances = 3;
    else if (uniquePokemonCount > 20) minAppearances = 2;

    return currentRankedPokemon
      .filter(p => {
        const confidence = p.count / avgParticipations;
        return p.count >= minAppearances || confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) return;

    // ✅ Immediate, fresh calculation (critical fix!)
    const immediatelyGeneratedRankings = generateRankings(battleResults);
    const confidentNow = getConfidentRankedPokemon(immediatelyGeneratedRankings, CONFIDENCE_THRESHOLD);

    setMilestoneRankings(prev => ({
      ...prev,
      [milestoneHit]: confidentNow
    }));

    hitMilestones.current.add(milestoneHit);
    console.log(`📸 Milestone ${milestoneHit} snapshot saved with ${confidentNow.length} Pokémon`);
  };

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  const getBattlesRemaining = () => {
    const uniquePokemonCount = rankedPokemon.length || 1;
    const log2N = Math.log2(uniquePokemonCount);
    return Math.max(0, Math.ceil(uniquePokemonCount * log2N) - battleResults.length);
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
  getConfidentRankedPokemon: (currentRankedPokemon: RankedPokemon[], threshold = CONFIDENCE_THRESHOLD) => 
    getConfidentRankedPokemon(currentRankedPokemon, threshold),
  getOverallRankingProgress,
  confidenceScores,
  getSnapshotForMilestone,
  resetMilestones
};
};
