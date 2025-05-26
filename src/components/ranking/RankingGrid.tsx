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

  // Get ranking number color based on pokemon's primary type
  const getRankingNumberColor = (pokemon: RankedPokemon): string => {
    if (!pokemon.types || pokemon.types.length === 0) {
      return 'bg-gray-500 text-white'; // Default fallback
    }
    
    // Extract the primary type name
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
    
    // Type color mapping for ranking numbers
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-gray-500 text-white',
      'fighting': 'bg-red-600 text-white',
      'flying': 'bg-blue-400 text-white',
      'poison': 'bg-purple-600 text-white',
      'ground': 'bg-yellow-600 text-white',
      'rock': 'bg-stone-600 text-white',
      'bug': 'bg-green-500 text-white',
      'ghost': 'bg-purple-700 text-white',
      'steel': 'bg-slate-500 text-white',
      'fire': 'bg-red-500 text-white',
      'water': 'bg-blue-500 text-white',
      'grass': 'bg-green-600 text-white',
      'electric': 'bg-yellow-500 text-white',
      'psychic': 'bg-pink-500 text-white',
      'ice': 'bg-cyan-500 text-white',
      'dragon': 'bg-indigo-600 text-white',
      'dark': 'bg-gray-800 text-white',
      'fairy': 'bg-pink-400 text-white'
    };
    
    return typeToColorMap[primaryType] || 'bg-gray-500 text-white';
  };

  // Enhanced Pokemon background color based on primary type
  const getPokemonBackgroundColor = (pokemon: RankedPokemon): string => {
    if (!pokemon.types || pokemon.types.length === 0) {
      return 'bg-gray-100 border-gray-300';
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
    
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-gray-100 border-gray-300',
      'fighting': 'bg-red-100 border-red-300',
      'flying': 'bg-blue-100 border-blue-300',
      'poison': 'bg-purple-100 border-purple-300',
      'ground': 'bg-yellow-100 border-yellow-300',
      'rock': 'bg-stone-100 border-stone-300',
      'bug': 'bg-green-100 border-green-300',
      'ghost': 'bg-purple-200 border-purple-400',
      'steel': 'bg-slate-100 border-slate-300',
      'fire': 'bg-red-100 border-red-300',
      'water': 'bg-blue-100 border-blue-300',
      'grass': 'bg-green-100 border-green-300',
      'electric': 'bg-yellow-100 border-yellow-300',
      'psychic': 'bg-pink-100 border-pink-300',
      'ice': 'bg-cyan-100 border-cyan-300',
      'dragon': 'bg-indigo-100 border-indigo-300',
      'dark': 'bg-gray-200 border-gray-400',
      'fairy': 'bg-pink-100 border-pink-300'
    };
    
    return typeToColorMap[primaryType] || 'bg-gray-100 border-gray-300';
  };

  if (isMilestoneView) {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-3xl">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Milestone: {battlesCompleted} Battles
            </h2>
          </div>
          <p className="text-gray-600 mb-2">
            (Showing {Math.min(displayCount || displayRankings.length, displayRankings.length)} of {activeTier === "All" ? displayRankings.length : activeTier})
          </p>
          
          {onContinueBattles && (
            <Button 
              onClick={onContinueBattles}
              size="lg"
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg"
            >
              Continue Battles
            </Button>
          )}
        </div>

        {/* Horizontal cards layout like in the original image */}
        <div className="space-y-2">
          {displayRankings.map((pokemon, index) => {
            const backgroundColorClass = getPokemonBackgroundColor(pokemon);
            const rankingNumberColor = getRankingNumberColor(pokemon);
            
            return (
              <div 
                key={pokemon.id}
                className={`${backgroundColorClass} rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg relative flex items-center gap-4`}
                onMouseEnter={() => setHoveredPokemon(pokemon.id)}
                onMouseLeave={() => setHoveredPokemon(null)}
              >
                {/* Ranking number circle */}
                <div className={`w-10 h-10 ${rankingNumberColor} rounded-full flex items-center justify-center text-sm font-bold shadow-lg flex-shrink-0`}>
                  {index + 1}
                </div>
                
                {/* Pokemon image */}
                <div className="w-16 h-16 bg-white/70 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                  <img 
                    src={pokemon.image} 
                    alt={pokemon.name}
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Pokemon info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg truncate">
                    {pokemon.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    #{pokemon.id}
                  </div>
                </div>
                
                {pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Suggested</span>
                  </div>
                )}

                {hoveredPokemon === pokemon.id && onSuggestRanking && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => handleSuggestion(pokemon, "up")}
                      className="p-2 bg-green-100 hover:bg-green-200 rounded transition-colors shadow-sm"
                      title="Suggest ranking higher"
                    >
                      <ChevronUp className="w-4 h-4 text-green-600" />
                    </button>
                    
                    <button
                      onClick={() => handleSuggestion(pokemon, "down")}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded transition-colors shadow-sm"
                      title="Suggest ranking lower"
                    >
                      <ChevronDown className="w-4 h-4 text-red-600" />
                    </button>
                    
                    {pokemon.suggestedAdjustment && (
                      <button
                        onClick={() => handleRemoveSuggestion(pokemon.id)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors shadow-sm"
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
          <div className="text-center pt-6">
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
