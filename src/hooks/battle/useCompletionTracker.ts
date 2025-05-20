import { useState, useRef, useEffect } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  showingMilestone: boolean,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  allPokemonForGeneration: any[]
) => {
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const hitMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    calculateCompletionPercentage();
    checkAndHandleMilestone();
  }, [battleResults.length]);

  const calculateCompletionPercentage = () => {
    const totalPokemon = allPokemonForGeneration.length;
    const expectedBattles = Math.ceil(totalPokemon * Math.log2(totalPokemon));
    const completionPercent = Math.min(100, (battleResults.length / expectedBattles) * 100);
    setCompletionPercentage(parseFloat(completionPercent.toFixed(2)));

    if (completionPercent >= 100 && battleResults.length >= 50) {
      generateRankings(battleResults);
      setRankingGenerated(true);
      toast({
        title: "Complete Ranking Achieved!",
        description: "Full Pokémon ranking generated!",
        variant: "default"
      });
    }
  };

  const checkAndHandleMilestone = () => {
    const milestoneHit = MILESTONES.find(m => m === battleResults.length);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) return;

    const snapshot = generateRankings(battleResults).filter(p => p && p.id);
    if (snapshot.length === 0) {
      console.error(`Milestone ${milestoneHit} generated an empty or invalid snapshot.`);
      return;
    }

    setMilestoneRankings(prev => ({...prev, [milestoneHit]: snapshot}));
    hitMilestones.current.add(milestoneHit);
    setShowingMilestone(true);
  };

  const resetMilestones = () => {
    hitMilestones.current.clear();
    setMilestoneRankings({});
  };

  const getSnapshotForMilestone = (battleCount: number) => milestoneRankings[battleCount] || [];

  return {
    calculateCompletionPercentage,
    resetMilestones,
    getSnapshotForMilestone
  };
};
