
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import { Trophy, Award, Medal } from "lucide-react";
import { getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Map of Pokemon types to colors (corrected and expanded)
const typeColors: Record<string, string> = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-blue-200",
  fighting: "bg-red-700",
  poison: "bg-purple-600",
  ground: "bg-yellow-700",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-stone-500",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-600",
  dark: "bg-stone-800 text-white",
  steel: "bg-slate-400",
  fairy: "bg-pink-300",
  // Added for case insensitivity
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
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings,
  isMilestoneView = false,
  activeTier,
  onTierChange
}) => {
  console.log("🟣 RankingDisplay component rendered with", finalRankings.length, "Pokémon");
  const [displayCount, setDisplayCount] = useState(20);
  
  // Take the top rankings to display
  const displayRankings = finalRankings.slice(0, displayCount);
  
  // Add debugging to show Pokemon with their types
  useEffect(() => {
    console.log("Pokemon list with types:");
    displayRankings.slice(0, 5).forEach((pokemon, index) => {
      console.log(`${index + 1}. ${pokemon.name} (ID: ${pokemon.id}) - Types: ${pokemon.types?.join(', ') || 'unknown'}`);
    });
  }, [displayRankings]);
  
  // Get primary type color for a Pokemon with better error handling
  const getPokemonTypeColor = (pokemon: Pokemon) => {
    // Safeguard against missing types data
    if (!pokemon.types || !pokemon.types.length) {
      return "bg-gray-200";
    }
    
    // Get primary type (first in the array)
    const primaryType = pokemon.types[0];
    
    // Look up the color, with explicit string type check
    const color = typeColors[primaryType];
    
    // If no color is found, return a default
    if (!color) {
      console.warn(`No color found for type: ${primaryType} on ${pokemon.name}`);
      return "bg-gray-200";
    }
    
    return color;
  };

  // Handler for the "Show More" button
  const handleShowMore = () => {
    // Increase by a larger number to display more Pokémon at once
    const increment = 50;
    const newCount = Math.min(displayCount + increment, finalRankings.length);
    console.log(`Increasing display count from ${displayCount} to ${newCount} of ${finalRankings.length} total`);
    setDisplayCount(newCount);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {isMilestoneView ? `Milestone: ${battlesCompleted} Battles` : "Current Rankings"}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            (Showing {displayCount} of {finalRankings.length})
          </span>
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
          const typeColor = getPokemonTypeColor(pokemon);
          
          return (
            <div key={pokemon.id} className="relative flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Rank number with type-colored background */}
              <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              
              {/* Pokemon image in center - more compact */}
              <div className={`p-1 flex items-center justify-center ${typeColor} bg-opacity-20`}>
                <div className="w-full aspect-square relative flex items-center justify-center max-h-20">
                  <img 
                    src={getPreferredImageUrl(pokemon.id)} 
                    alt={pokemon.name} 
                    className="object-contain max-h-16 p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Try a fallback if first image fails
                      target.src = getPreferredImageUrl(pokemon.id, 1);
                    }}
                  />
                </div>
              </div>
              
              {/* Pokemon info at bottom */}
              <div className="py-1 px-2 text-center border-t border-gray-100">
                <div className="font-medium text-xs truncate">{pokemon.name}</div>
                <div className="text-xs text-muted-foreground">#{pokemon.id}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {finalRankings.length > displayCount && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            onClick={handleShowMore}
            className="px-8"
          >
            Show More ({displayCount}/{finalRankings.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default RankingDisplay;
