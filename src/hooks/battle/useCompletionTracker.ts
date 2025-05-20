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
  const [completionPercentCalculated, setCompletionPercentCalculated] = useState(false);
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<number | null>(null);
  const hitMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults.length, allPokemonForGeneration?.length]);

  useEffect(() => {
    checkAndHandleMilestone();
  }, [battleResults.length]);

  useEffect(() => {
    if (
      pendingMilestone !== null &&
      milestoneRankings[pendingMilestone]?.length > 0 &&
      !showingMilestone
    ) {
      console.log(`✅ Milestone ${pendingMilestone} rankings confirmed available, now showing UI`);
      setShowingMilestone(true);
      setPendingMilestone(null);
    }
  }, [milestoneRankings, pendingMilestone, showingMilestone, setShowingMilestone]);

  const calculateCompletionPercentage = () => {
    const totalPokemon = allPokemonForGeneration?.length || 1;
    const expectedBattles = Math.ceil(totalPokemon * Math.log2(totalPokemon));
    const completionPercent = Math.min(100, (battleResults.length / expectedBattles) * 100);
    
    setCompletionPercentage(parseFloat(completionPercent.toFixed(2)));
    setCompletionPercentCalculated(true);

    if (completionPercent >= 100 && !currentRankingGenerated && battleResults.length >= 50) {
      const finalRankings = generateRankings(battleResults);
      setRankingGenerated(true);
      setCurrentRankingGenerated(true);
      console.log("Full ranking achieved with", finalRankings.length, "Pokémon");
      toast({
        title: "Complete Ranking Achieved!",
        description: "You've completed enough battles to generate a full ranking of all Pokémon!",
        variant: "default"
      });
    }
  };

  const checkAndHandleMilestone = () => {
    const currentBattleCount = battleResults.length;

    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) {
      return; 
    }

    console.log(`🏆 Milestone ${milestoneHit} reached - generating snapshot rankings`);

    const milestoneRankingSnapshot = generateRankings(battleResults);

    setMilestoneRankings(prev => ({
      ...prev,
      [milestoneHit]: milestoneRankingSnapshot
    }));

    hitMilestones.current.add(milestoneHit);

    console.log(`📸 Milestone ${milestoneHit} snapshot saved with ${milestoneRankingSnapshot.length} Pokémon`);
    setPendingMilestone(milestoneHit);
  };

  const getBattlesRemaining = () => {
    const totalPokemon = allPokemonForGeneration?.length || 1;
    const expectedBattles = Math.ceil(totalPokemon * Math.log2(totalPokemon));
    return Math.max(0, expectedBattles - battleResults.length);
  };

  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  const resetMilestones = () => {
    hitMilestones.current.clear();
    setMilestoneRankings({});
    setCurrentRankingGenerated(false);
    setCompletionPercentCalculated(false);
    setPendingMilestone(null);
  };

  return {
    calculateCompletionPercentage,
    getBattlesRemaining,
    getSnapshotForMilestone,
    resetMilestones
  };
};
