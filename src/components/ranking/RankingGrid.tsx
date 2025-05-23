
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
          const hasSuggestion = pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used;
          const hasUsedSuggestion = pokemon.suggestedAdjustment?.used;

          return (
            <div 
              key={pokemon.id} 
              className={`relative group overflow-hidden bg-white rounded-lg border ${
                isFrozen ? 'border-gray-200 opacity-80' : 'border-gray-200 hover:border-primary hover:shadow-md'
              } transition-all`}
            >
              {/* Rank number */}
              <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md font-bold`}>
                {index + 1}
              </div>
              
              {/* Stats bubble */}
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium opacity-70 hover:opacity-100 z-10">
                {pokemon.score?.toFixed(1) || "??"} • {pokemon.confidence?.toFixed(0) || "?"}% • {pokemon.count || 0}
              </div>
              
              {/* Suggestion indicator - small permanent indicator */}
              {hasSuggestion && (
                <div 
                  className={`absolute bottom-2 right-2 w-4 h-4 rounded-full z-10
                    ${pokemon.suggestedAdjustment.direction === "up" 
                      ? "bg-green-500" 
                      : "bg-red-500"
                    } flex items-center justify-center text-white text-xs font-bold`}
                  title={`Suggested to rank ${pokemon.suggestedAdjustment.direction === "up" ? "higher" : "lower"} (x${pokemon.suggestedAdjustment.strength})`}
                >
                  {pokemon.suggestedAdjustment.strength}
                </div>
              )}
              
              {/* Used suggestion checkmark */}
              {hasUsedSuggestion && (
                <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold z-10" title="This suggestion has been used">
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
              </div>
              
              {/* Voting arrows component - appear on hover over the entire card */}
              {onSuggestRanking && onRemoveSuggestion && !isFrozen && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
