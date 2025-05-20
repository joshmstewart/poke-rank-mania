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
  const milestoneInProgress = useRef(false);

  const calculateCompletionPercentage = () => {
    const totalPokemon = allPokemonForGeneration?.length || 1;
    const expectedBattles = Math.ceil(totalPokemon * Math.log2(totalPokemon));
    const completionPercent = Math.min(100, (battleResults.length / expectedBattles) * 100);

    setCompletionPercentage(parseFloat(completionPercent.toFixed(2)));

    if (completionPercent >= 100 && battleResults.length >= 50) {
      const finalRankings = generateRankings(battleResults);
      setRankingGenerated(true);
      toast({
        title: "Complete Ranking Achieved!",
        description: "You've completed enough battles to generate a full ranking of all Pokémon!",
        variant: "default"
      });
    }
  };

  const checkAndHandleMilestone = () => {
    const currentBattleCount = battleResults.length;

    if (hitMilestones.current.has(currentBattleCount) || !MILESTONES.includes(currentBattleCount)) {
      return;
    }

    if (milestoneInProgress.current) return;
    milestoneInProgress.current = true;

    const milestoneSnapshot = generateRankings(battleResults);

    setMilestoneRankings(prev => ({
      ...prev,
      [currentBattleCount]: milestoneSnapshot
    }));

    hitMilestones.current.add(currentBattleCount);

    setShowingMilestone(true);
  };

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults.length, allPokemonForGeneration.length]);

  useEffect(() => {
    checkAndHandleMilestone();
  }, [battleResults.length]);

  useEffect(() => {
    if (!showingMilestone) {
      milestoneInProgress.current = false;
    }
  }, [showingMilestone]);

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  const resetMilestones = () => {
    hitMilestones.current.clear();
    setMilestoneRankings({});
    milestoneInProgress.current = false;
  };

  const getBattlesRemaining = () => {
    const totalPokemon = allPokemonForGeneration?.length || 1;
    const expectedBattles = Math.ceil(totalPokemon * Math.log2(totalPokemon));
    return Math.max(0, expectedBattles - battleResults.length);
  };

  return {
    calculateCompletionPercentage,
    getBattlesRemaining,
    getSnapshotForMilestone,
    resetMilestones
  };
};
