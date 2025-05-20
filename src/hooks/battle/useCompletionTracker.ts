
import { useEffect, useRef, useState } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  showingMilestone: boolean,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  allPokemon: any[]
) => {
  const hitMilestones = useRef(new Set<number>());
  const [milestoneRankings, setMilestoneRankings] = useState<Record<number, RankedPokemon[]>>({});

  useEffect(() => {
    const battleCount = battleResults.length;
    if (MILESTONES.includes(battleCount) && !hitMilestones.current.has(battleCount)) {
      hitMilestones.current.add(battleCount);
      const rankingsSnapshot = generateRankings(battleResults);
      setMilestoneRankings(prev => ({ ...prev, [battleCount]: rankingsSnapshot }));

      if (rankingsSnapshot.length > 0) {
        setShowingMilestone(true);
      } else {
        console.warn("Snapshot was empty, skipping milestone.");
      }
    }
  }, [battleResults, generateRankings, setMilestoneRankings, setShowingMilestone]);

  const resetMilestones = () => {
    hitMilestones.current.clear();
    setMilestoneRankings({});
  };
  
  const resetMilestoneRankings = () => {
    setMilestoneRankings({});
  };
  
  const calculateCompletionPercentage = () => {
    if (!allPokemon || allPokemon.length === 0) return 0;
    
    const totalBattlesNeeded = allPokemon.length * Math.log2(allPokemon.length);
    const percentage = Math.min(100, Math.floor((battleResults.length / totalBattlesNeeded) * 100));
    setCompletionPercentage(percentage);
    return percentage;
  };
  
  const getSnapshotForMilestone = (battleCount: number): RankedPokemon[] => {
    return milestoneRankings[battleCount] || [];
  };

  return { 
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone
  };
};
