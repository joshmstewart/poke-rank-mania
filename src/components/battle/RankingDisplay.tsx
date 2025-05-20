import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pokemon } from "@/services/pokemon";
import { RankedPokemon } from "@/hooks/battle/useRankings";
import PokemonCard from "@/components/PokemonCard";
import { Trophy, Award, Medal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RankingDisplayProps {
  finalRankings: Pokemon[] | RankedPokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
  onSaveRankings: () => void;
  isMilestoneView?: boolean;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings,
  isMilestoneView = false
}) => {
  console.log("🟣 RankingDisplay component rendered");

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">
          {isMilestoneView ? `Milestone: ${battlesCompleted} Battles` : "Current Rankings"}
        </h2>
      </div>

      <Button onClick={onContinueBattles}>Continue Battles</Button>
      {!isMilestoneView && rankingGenerated && (
        <Button onClick={onNewBattleSet}>Start New Battle Set</Button>
      )}
      {!isMilestoneView && rankingGenerated && (
        <Button onClick={onSaveRankings}>Save Rankings</Button>
      )}
    </div>
  );
};

export default RankingDisplay;
