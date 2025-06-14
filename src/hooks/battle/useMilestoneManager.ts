
import { useState, useEffect, useRef } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useBattleRankings } from "./useBattleRankings";

const BATTLE_MILESTONE_INTERVAL = 25;

export const useMilestoneManager = (battlesCompleted: number) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const lastMilestoneRef = useRef(0);
  const { generateRankingsFromBattleHistory } = useBattleRankings();

  useEffect(() => {
    // Prevent running on initial render if battlesCompleted is already a milestone number from a previous session
    if (battlesCompleted === 0) return;

    const isMilestone = battlesCompleted > 0 && battlesCompleted % BATTLE_MILESTONE_INTERVAL === 0;
    const isNewMilestone = battlesCompleted !== lastMilestoneRef.current;

    if (isMilestone && isNewMilestone) {
      console.log(`🎉 [MILESTONE_MANAGER] Milestone reached: ${battlesCompleted} battles`);
      lastMilestoneRef.current = battlesCompleted;

      const newRankings = generateRankingsFromBattleHistory([]);
      console.log(`🎉 [MILESTONE_MANAGER] Generated ${newRankings.length} rankings for milestone.`);
      setFinalRankings(newRankings);
      setShowingMilestone(true);
    }
  }, [battlesCompleted, generateRankingsFromBattleHistory]);

  return {
    finalRankings,
    setFinalRankings,
    showingMilestone,
    setShowingMilestone,
  };
};
