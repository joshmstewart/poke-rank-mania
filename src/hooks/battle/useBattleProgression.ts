
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to handle battle progression and milestone checks
 */
export const useBattleProgression = (
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: any[]) => void,
) => {
  // Check if we've hit a milestone
  const checkMilestone = useCallback((newBattlesCompleted: number, battleResults: any[]) => {
    if (milestones.includes(newBattlesCompleted)) {
      console.log(`useBattleProgression: Milestone reached at ${newBattlesCompleted} battles`);
      
      // Force rankings generation with current results immediately
      generateRankings(battleResults);
      setShowingMilestone(true);
      
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
      });
      
      return true;
    }
    return false;
  }, [milestones, generateRankings, setShowingMilestone]);

  // Increment battles completed counter
  const incrementBattlesCompleted = useCallback(() => {
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`useBattleProgression: Incrementing battles from ${battlesCompleted} to ${newBattlesCompleted}`);
    setBattlesCompleted(newBattlesCompleted);
    return newBattlesCompleted;
  }, [battlesCompleted, setBattlesCompleted]);

  return {
    checkMilestone,
    incrementBattlesCompleted
  };
};
