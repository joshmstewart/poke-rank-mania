
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pokemon } from "@/services/pokemon";
import { RankedPokemon } from "@/hooks/battle/useRankings";
import { Trophy, Award, Medal } from "lucide-react";
import { getPreferredImageType, getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Map of Pokemon types to colors
const typeColors: Record<string, string> = {
  Normal: "bg-gray-400",
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Electric: "bg-yellow-400",
  Grass: "bg-green-500",
  Ice: "bg-blue-200",
  Fighting: "bg-red-700",
  Poison: "bg-purple-600",
  Ground: "bg-yellow-700",
  Flying: "bg-indigo-300",
  Psychic: "bg-pink-500",
  Bug: "bg-lime-500",
  Rock: "bg-stone-500",
  Ghost: "bg-purple-700",
  Dragon: "bg-indigo-600",
  Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400",
  Fairy: "bg-pink-300",
};

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
  
  // Get primary type color for a Pokemon
  const getPokemonTypeColor = (pokemon: Pokemon) => {
    if (!pokemon.types || !pokemon.types.length) return "bg-gray-100";
    const primaryType = pokemon.types[0];
    return typeColors[primaryType] || "bg-gray-100";
  };

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayRankings.map((pokemon, index) => {
          const typeColor = getPokemonTypeColor(pokemon as Pokemon);
          
          return (
            <div key={pokemon.id} className="relative flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-auto">
              {/* Rank number with type-colored background */}
              <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              
              {/* Pokemon image in center */}
              <div className={`p-2 flex items-center justify-center ${typeColor} bg-opacity-10`}>
                <div className="w-full aspect-square relative flex items-center justify-center">
                  <img 
                    src={getPreferredImageUrl(pokemon.id)} 
                    alt={pokemon.name} 
                    className="object-contain max-h-24 p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                    }}
                  />
                </div>
              </div>
              
              {/* Pokemon info at bottom */}
              <div className="py-2 px-3 border-t border-gray-100 bg-white">
                <div className="flex flex-col">
                  <div className="font-medium text-sm truncate text-center">{pokemon.name}</div>
                  <div className="text-xs text-muted-foreground text-center">#{pokemon.id}</div>
                </div>
              </div>
            </div>
          );
        })}
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
