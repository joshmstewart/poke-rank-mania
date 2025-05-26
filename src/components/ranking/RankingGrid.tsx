
import React, { useState, useCallback } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import ShowMoreButton from "../battle/ShowMoreButton";
import { Button } from "@/components/ui/button";

interface RankingGridProps {
  displayRankings: RankedPokemon[];
  activeTier?: TopNOption;
  totalCount?: number;
  displayCount?: number;
  onShowMore?: () => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  isMilestoneView?: boolean;
  battlesCompleted?: number;
  onContinueBattles?: () => void;
}

export const RankingGrid: React.FC<RankingGridProps> = ({
  displayRankings,
  activeTier = 25,
  totalCount,
  displayCount,
  onShowMore,
  onSuggestRanking,
  onRemoveSuggestion,
  isMilestoneView = false,
  battlesCompleted = 0,
  onContinueBattles
}) => {
  const [hoveredPokemon, setHoveredPokemon] = useState<number | null>(null);

  const handleSuggestion = useCallback((pokemon: RankedPokemon, direction: "up" | "down") => {
    if (onSuggestRanking) {
      onSuggestRanking(pokemon, direction, 2);
    }
  }, [onSuggestRanking]);

  const handleRemoveSuggestion = useCallback((pokemonId: number) => {
    if (onRemoveSuggestion) {
      onRemoveSuggestion(pokemonId);
    }
  }, [onRemoveSuggestion]);

  // Enhanced Pokemon background color based on primary type - matching the reference images
  const getPokemonBackgroundColor = (pokemon: RankedPokemon): string => {
    if (!pokemon.types || pokemon.types.length === 0) {
      return 'bg-gray-200';
    }
    
    let primaryType = 'unknown';
    
    if (typeof pokemon.types[0] === 'string') {
      primaryType = pokemon.types[0].toLowerCase();
    } else if (pokemon.types[0] && typeof pokemon.types[0] === 'object') {
      const typeObj = pokemon.types[0] as any;
      if (typeObj.type && typeObj.type.name) {
        primaryType = typeObj.type.name.toLowerCase();
      } else if (typeObj.name) {
        primaryType = typeObj.name.toLowerCase();
      }
    }
    
    // Vibrant type colors matching the reference images
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-gray-200',
      'fighting': 'bg-red-200',
      'flying': 'bg-blue-200',
      'poison': 'bg-purple-200',
      'ground': 'bg-yellow-200',
      'rock': 'bg-yellow-300',
      'bug': 'bg-green-200',
      'ghost': 'bg-purple-300',
      'steel': 'bg-gray-300',
      'fire': 'bg-red-200',
      'water': 'bg-blue-200',
      'grass': 'bg-green-200',
      'electric': 'bg-yellow-200',
      'psychic': 'bg-pink-200',
      'ice': 'bg-cyan-200',
      'dragon': 'bg-indigo-200',
      'dark': 'bg-gray-400',
      'fairy': 'bg-pink-200'
    };
    
    return typeToColorMap[primaryType] || 'bg-gray-200';
  };

  if (isMilestoneView) {
    return (
      <div className="space-y-6">
        {/* Milestone Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <h2 className="text-xl font-bold text-gray-800">
              Milestone: {battlesCompleted} Battles
            </h2>
            <span className="text-sm text-gray-600">
              (Showing {Math.min(displayCount || displayRankings.length, displayRankings.length)} of {activeTier === "All" ? displayRankings.length : activeTier})
            </span>
          </div>
          
          {onContinueBattles && (
            <Button 
              onClick={onContinueBattles}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg"
            >
              Continue Battles
            </Button>
          )}
        </div>

        {/* Grid Layout - 5 columns with type-based background colors */}
        <div className="grid grid-cols-5 gap-4">
          {displayRankings.map((pokemon, index) => {
            const backgroundColorClass = getPokemonBackgroundColor(pokemon);
            
            return (
              <div 
                key={pokemon.id}
                className={`${backgroundColorClass} rounded-lg border border-gray-300 relative overflow-hidden transition-all duration-200 hover:shadow-md aspect-[4/5] flex flex-col`}
                onMouseEnter={() => setHoveredPokemon(pokemon.id)}
                onMouseLeave={() => setHoveredPokemon(null)}
              >
                {/* Ranking number - dark circle in top left */}
                <div className="absolute top-3 left-3 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                  {index + 1}
                </div>
                
                {/* Pokemon image - centered in upper portion */}
                <div className="flex-1 flex justify-center items-center pt-8 pb-2">
                  <img 
                    src={pokemon.image} 
                    alt={pokemon.name}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Pokemon info - bottom section with proper spacing */}
                <div className="text-center pb-4 px-3">
                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">
                    {pokemon.name}
                  </h3>
                  <div className="text-xs text-gray-600">
                    #{pokemon.id}
                  </div>
                </div>

                {pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used && (
                  <div className="absolute top-3 right-3 text-yellow-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {hoveredPokemon === pokemon.id && onSuggestRanking && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 rounded-lg">
                    <button
                      onClick={() => handleSuggestion(pokemon, "up")}
                      className="p-2 bg-green-100 hover:bg-green-200 rounded transition-colors"
                      title="Suggest ranking higher"
                    >
                      <ChevronUp className="w-4 h-4 text-green-600" />
                    </button>
                    
                    <button
                      onClick={() => handleSuggestion(pokemon, "down")}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded transition-colors"
                      title="Suggest ranking lower"
                    >
                      <ChevronDown className="w-4 h-4 text-red-600" />
                    </button>
                    
                    {pokemon.suggestedAdjustment && (
                      <button
                        onClick={() => handleRemoveSuggestion(pokemon.id)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
                        title="Remove suggestion"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {onShowMore && totalCount && displayCount && displayCount < totalCount && (
          <div className="text-center pt-4">
            <ShowMoreButton 
              onShowMore={onShowMore}
              displayCount={displayCount}
              totalCount={totalCount}
            />
          </div>
        )}
      </div>
    );
  }

  // Standard ranking view (non-milestone) - keep existing grid layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {displayRankings.map((pokemon, index) => (
        <div 
          key={pokemon.id}
          className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-200 hover:shadow-lg"
          onMouseEnter={() => setHoveredPokemon(pokemon.id)}
          onMouseLeave={() => setHoveredPokemon(null)}
        >
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              #{index + 1}
            </div>
            
            <div className="w-20 h-20 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={pokemon.image} 
                alt={pokemon.name}
                className="w-16 h-16 object-contain"
              />
            </div>
            
            <h3 className="font-semibold text-gray-800 text-sm mb-1">
              {pokemon.name}
            </h3>
            
            <div className="text-xs text-gray-600 mb-2">
              {pokemon.types?.join(', ') || 'Unknown'}
            </div>
            
            <div className="text-xs text-gray-500">
              Score: {Math.round(pokemon.score || 0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
