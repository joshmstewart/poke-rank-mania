
import { useEffect } from "react";
import { RankedPokemon } from "@/services/pokemon";

interface LoggingHookProps {
  battlesCompleted: number;
  milestones: number[];
  showingMilestone: boolean;
  rankingGenerated: boolean;
  finalRankings: RankedPokemon[];
  battleHistory: { battle: any[], selected: number[] }[];
}

export const useBattleStateLogging = ({
  battlesCompleted,
  milestones,
  showingMilestone,
  rankingGenerated,
  finalRankings,
  battleHistory
}: LoggingHookProps) => {
  
  // Minimal state change logging - only critical errors
  useEffect(() => {
    if (showingMilestone && finalRankings.length === 0) {
      console.error('CRITICAL: finalRankings is EMPTY when milestone is showing!');
    }
  }, [showingMilestone, finalRankings]);
};
