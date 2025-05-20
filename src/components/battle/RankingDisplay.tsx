
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
  const [displayCount, setDisplayCount] = useState(20);
  
  // Take the top rankings to display
  const displayRankings = finalRankings.slice(0, displayCount);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {isMilestoneView ? `Milestone: ${battlesCompleted} Battles` : "Current Rankings"}
        </h2>
        <div className="flex gap-2">
          <Button onClick={onContinueBattles} variant="default">Continue Battles</Button>
          {!isMilestoneView && rankingGenerated && (
            <Button onClick={onNewBattleSet} variant="outline">Start New Battle Set</Button>
          )}
          {!isMilestoneView && rankingGenerated && (
            <Button onClick={onSaveRankings} variant="outline">Save Rankings</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayRankings.map((pokemon, index) => (
          <div key={pokemon.id} className="relative">
            <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center shadow-md border border-gray-200">
              <span className="text-sm font-bold">{index + 1}</span>
            </div>
            <PokemonCard 
              pokemon={pokemon} 
              compact={true}
            />
          </div>
        ))}
      </div>
      
      {finalRankings.length > displayCount && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            onClick={() => setDisplayCount(prev => Math.min(prev + 20, finalRankings.length))}
          >
            Show More
          </Button>
        </div>
      )}
    </div>
  );
};

export default RankingDisplay;
