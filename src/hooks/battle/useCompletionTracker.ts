
import { useState, useRef, useEffect } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  allPokemonForGeneration: any[]
) => {
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});
  const [completionPercentCalculated, setCompletionPercentCalculated] = useState(false);
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);
  const hitMilestones = useRef<Set<number>>(new Set());

  // Track completion percentage based ONLY on battle count relative to total Pokémon
  useEffect(() => {
    if (battleResults.length > 0 || !completionPercentCalculated) {
      calculateCompletionPercentage();
    }
  }, [battleResults.length, allPokemonForGeneration?.length]);

  // Track milestone snapshots - completely separate logic
  useEffect(() => {
    if (battleResults.length > 0) {
      checkAndHandleMilestone();
    }
  }, [battleResults.length]);

  const calculateCompletionPercentage = () => {
    // Simple percentage based ONLY on expected total battles needed
    const totalPokemon = allPokemonForGeneration?.length || 1;
    const expectedBattles = Math.ceil(totalPokemon * Math.log2(totalPokemon));
    const completionPercent = Math.min(100, (battleResults.length / Math.max(expectedBattles, 1)) * 100);
    
    setCompletionPercentage(parseFloat(completionPercent.toFixed(2)));
    setCompletionPercentCalculated(true);

    // Check if we've reached full ranking status
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
    
    // Early exit if not a milestone or already tracked
    const milestoneHit = MILESTONES.find(m => m === currentBattleCount);
    if (!milestoneHit || hitMilestones.current.has(milestoneHit)) {
      return; 
    }

    console.log(`🏆 Milestone ${milestoneHit} reached - generating snapshot rankings`);
    
    // ✅ FIRST: Generate snapshot rankings for this milestone BEFORE setting UI state
    const milestoneRankingSnapshot = generateRankings(battleResults);
    
    // ✅ SECOND: Store the milestone snapshot
    setMilestoneRankings(prev => ({
      ...prev,
      [milestoneHit]: milestoneRankingSnapshot
    }));
    
    // ✅ THIRD: Mark this milestone as hit
    hitMilestones.current.add(milestoneHit);
    
    // ✅ LAST: Only NOW show the milestone UI after snapshot is safely stored
    console.log(`📸 Milestone ${milestoneHit} snapshot saved with ${milestoneRankingSnapshot.length} Pokémon`);
    setShowingMilestone(true);
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
  };

  return {
    calculateCompletionPercentage,
    getBattlesRemaining,
    getSnapshotForMilestone,
    resetMilestones
  };
};
