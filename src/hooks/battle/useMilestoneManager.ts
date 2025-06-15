
import { useState, useEffect, useRef } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useBattleRankings } from "./useBattleRankings";

const BATTLE_MILESTONE_INTERVAL = 25;

export const useMilestoneManager = (battlesCompleted: number, allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const lastMilestoneRef = useRef(0);
  const { generateRankingsFromTrueSkill } = useBattleRankings();

  useEffect(() => {
    // Prevent running on initial render or if Pokemon data isn't ready
    if (battlesCompleted === 0 || allPokemon.length === 0) return;

    const isMilestone = battlesCompleted > 0 && battlesCompleted % BATTLE_MILESTONE_INTERVAL === 0;
    const isNewMilestone = battlesCompleted !== lastMilestoneRef.current;

    if (isMilestone && isNewMilestone) {
      console.log(`🎉 [MILESTONE_MANAGER] Milestone reached: ${battlesCompleted} battles`);
      lastMilestoneRef.current = battlesCompleted;

      const newRankings = generateRankingsFromTrueSkill();
      console.log(`🎉 [MILESTONE_MANAGER] Generated ${newRankings.length} rankings for milestone.`);
      setFinalRankings(newRankings);
      setShowingMilestone(true);
    }
  }, [battlesCompleted, allPokemon, generateRankingsFromTrueSkill]);

  return {
    finalRankings,
    setFinalRankings,
    showingMilestone,
    setShowingMilestone,
  };
};

