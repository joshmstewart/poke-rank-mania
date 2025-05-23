
import React from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { normalizePokedexNumber, capitalizeSpecialForms } from "@/utils/pokemonUtils";
import { getPokemonTypeColor } from "@/components/battle/utils/pokemonTypeColors";
import { VotingArrows } from "./VotingArrows";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { getPokemonGeneration } from "./rankingUtils";

interface RankingGridProps {
  displayRankings: RankedPokemon[];
  activeTier: TopNOption;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  isMilestoneView?: boolean;
  battlesCompleted?: number;
  totalCount?: number;
  displayCount?: number;
  onShowMore?: () => void;
  onContinueBattles?: () => void;
}

export const RankingGrid: React.FC<RankingGridProps> = ({
  displayRankings,
  activeTier,
  onSuggestRanking,
  onRemoveSuggestion,
  isMilestoneView = false,
  battlesCompleted = 0,
  totalCount = 0,
  displayCount = 0,
  onShowMore,
  onContinueBattles
}) => {
  if (displayRankings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>You haven't ranked enough Pokémon to show confident results yet.</p>
        <p className="mt-2">Keep battling to refine your rankings!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with milestone info if applicable */}
      {isMilestoneView && battlesCompleted > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Milestone: {battlesCompleted} Battles</h2>
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground">
                (Showing {displayCount} of {totalCount})
              </span>
            )}
          </div>
          {onContinueBattles && (
            <Button onClick={onContinueBattles} className="bg-primary text-white">
              Continue Battles
            </Button>
          )}
        </div>
      )}
      
      {/* Grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayRankings.map((pokemon, index) => {
          const normalizedId = normalizePokedexNumber(pokemon.id);
          const formattedName = capitalizeSpecialForms(pokemon.name);
          const typeColor = getPokemonTypeColor(pokemon);
          const generation = getPokemonGeneration(pokemon.id);
          const isFrozen = pokemon.isFrozenForTier && pokemon.isFrozenForTier[activeTier.toString()];

          return (
            <div 
              key={pokemon.id} 
              className={`relative group overflow-hidden bg-white rounded-lg border ${isFrozen ? 'border-gray-200 opacity-80' : 'border-gray-200 hover:border-primary hover:shadow-md'} transition-all`}
            >
              {/* Rank number */}
              <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md font-bold`}>
                {index + 1}
              </div>
              
              {/* Suggestion indicator */}
              {pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used && (
                <div 
                  className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold z-10
                    ${pokemon.suggestedAdjustment.direction === "up" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {pokemon.suggestedAdjustment.direction === "up" 
                    ? "↑".repeat(pokemon.suggestedAdjustment.strength)
                    : "↓".repeat(pokemon.suggestedAdjustment.strength)
                  }
                </div>
              )}
              
              {/* Used suggestion checkmark */}
              {pokemon.suggestedAdjustment?.used && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-bold z-10">
                  ✓
                </div>
              )}
              
              {/* Pokemon image */}
              <div className={`p-4 flex items-center justify-center ${typeColor} bg-opacity-10`}>
                <img 
                  src={pokemon.image} 
                  alt={formattedName}
                  className={`h-24 object-contain ${isFrozen ? "opacity-70" : ""}`}
                />
              </div>
              
              {/* Pokemon info */}
              <div className="p-3 border-t border-gray-100">
                <div className="font-medium truncate text-center">{formattedName}</div>
                <div className="text-sm text-center text-muted-foreground">#{normalizedId}</div>
                
                {/* Stats that appear on hover */}
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div className="text-muted-foreground">Rating:</div>
                  <div className="text-right font-mono">{pokemon.score?.toFixed(1) || "N/A"}</div>
                  
                  <div className="text-muted-foreground">Confidence:</div>
                  <div className="text-right">{pokemon.confidence?.toFixed(0)}%</div>
                  
                  <div className="text-muted-foreground">Battles:</div>
                  <div className="text-right">{pokemon.count || 0}</div>
                </div>
              </div>
              
              {/* Voting arrows component - appear on hover */}
              {onSuggestRanking && onRemoveSuggestion && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <VotingArrows 
                    pokemon={pokemon} 
                    onSuggestRanking={onSuggestRanking}
                    onRemoveSuggestion={onRemoveSuggestion}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Show More button */}
      {displayCount < totalCount && onShowMore && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={onShowMore}
            className="w-full max-w-xs"
          >
            Show More ({displayCount}/{totalCount})
          </Button>
        </div>
      )}
    </div>
  );
};
