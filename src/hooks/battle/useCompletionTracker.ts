import { useEffect, useRef } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";

const MILESTONES = [10, 25, 50, 100];

export const useCompletionTracker = (
  battleResults: SingleBattle[],
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => RankedPokemon[],
  setMilestoneRankings: React.Dispatch<React.SetStateAction<Record<number, RankedPokemon[]>>>
) => {
  const hitMilestones = useRef(new Set<number>());

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

  return { resetMilestones };
};
