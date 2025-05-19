
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
  const initialCalculationDone = useRef(false);

  useEffect(() => {
    if (battleResults.length === 0) {
      // Reset completion percentage to 0 when there are no battles
      setCompletionPercentage(0);
      initialCalculationDone.current = true;
      return;
    }
    
    calculateCompletionPercentage();
    handleMilestoneSnapshot();
  }, [battleResults?.length]);

  const calculateCompletionPercentage = () => {
    // Return 0% for empty state
    if (!rankedPokemon || rankedPokemon.length === 0 || battleResults.length === 0) {
      setCompletionPercentage(0);
      setConfidenceScores({});
      return;
    }

    const log2N = Math.log2(rankedPokemon.length || 1);
    const confidences = rankedPokemon.map(p => Math.min(1, p.count / log2N));
    const percent = Math.round((confidences.reduce((a, b) => a + b, 0) / (rankedPokemon.length || 1)) * 100);

    console.log(`Calculating completion percentage: ${percent}% from ${rankedPokemon.length} Pokemon with ${battleResults.length} battles`);
    setCompletionPercentage(percent);

    const confidenceMap: Record<number, number> = {};
    rankedPokemon.forEach(p => {
      confidenceMap[p.id] = Math.round(Math.min(1, p.count / log2N) * 100);
    });
    setConfidenceScores(confidenceMap);

    initialCalculationDone.current = true;

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
    if (!rankedPokemon || rankedPokemon.length === 0) return 0;
    const log2N = Math.log2(rankedPokemon.length || 1);
    return Math.max(0, Math.ceil(rankedPokemon.length * log2N) - battleResults.length);
  };

  const getConfidentRankedPokemon = (threshold = 0.5) => {
    if (!rankedPokemon || rankedPokemon.length === 0) return [];
    
    const log2N = Math.log2(rankedPokemon.length || 1);
    const minAppearances = Math.max(2, Math.floor(Math.log2(battleResults.length || 1)));

    const confident = rankedPokemon
      .filter(p => {
        const confidence = p.count / log2N;
        return p.count >= minAppearances && confidence >= threshold;
      })
      .sort((a, b) => b.score - a.score);

    console.log(`📊 ${battleResults.length} battles → minAppearances: ${minAppearances}, log2N: ${log2N.toFixed(2)}`);
    console.log("📌 Snapshot Source:", rankedPokemon.length, "ranked Pokémon");
    
    return confident;
  };

  const handleMilestoneSnapshot = () => {
    const currentBattleCount = battleResults.length;
    if (currentBattleCount === 0) return;
    
    const lastMilestoneHit = Math.max(...MILESTONES.filter(m => m <= currentBattleCount));

    if (lastMilestoneHit && !hitMilestones.current.has(lastMilestoneHit)) {
      console.log(`Creating milestone snapshot for battle count ${lastMilestoneHit}`);
      
      // First ensure we have the latest rankings
      generateRankings(battleResults);
      
      // Then create the snapshot with the updated rankings
      setTimeout(() => {
        const confidentNow = getConfidentRankedPokemon(0.5);
        console.log(`Milestone ${lastMilestoneHit} snapshot created with ${confidentNow.length} confident Pokemon`);
        
        setMilestoneRankings(prev => ({
          ...prev,
          [lastMilestoneHit]: confidentNow
        }));
        hitMilestones.current.add(lastMilestoneHit);
      }, 0);
    }
  };

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    console.log(`Getting snapshot for milestone ${battleCount}, available:`, Object.keys(milestoneRankings));
    return milestoneRankings[battleCount] || [];
  };

  const getOverallRankingProgress = () => {
    return Object.values(confidenceScores).reduce((a, b) => a + b, 0) / (Object.keys(confidenceScores).length || 1);
  };

  const resetMilestones = () => {
    hitMilestones.current = new Set();
    setMilestoneRankings({});
    setCurrentRankingGenerated(false);
    setConfidenceScores({});
    setCompletionPercentage(0);
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
