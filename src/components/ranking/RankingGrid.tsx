
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

  // Enhanced Pokemon background color based on primary type - matching the image design
  const getPokemonBackgroundColor = (pokemon: RankedPokemon): string => {
    console.log(`[DEBUG Background Color] Pokemon ${pokemon.name} types:`, pokemon.types);
    
    if (!pokemon.types || pokemon.types.length === 0) {
      return 'bg-gray-200 border-gray-300'; // Default fallback
    }
    
    // Extract the primary type name from the types array
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
    
    console.log(`[DEBUG Background Color] Primary type for ${pokemon.name}:`, primaryType);
    
    // Type color mapping matching the image design
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-gray-200 border-gray-300',
      'fighting': 'bg-red-200 border-red-300',
      'flying': 'bg-blue-200 border-blue-300',
      'poison': 'bg-purple-200 border-purple-300',
      'ground': 'bg-yellow-200 border-yellow-300',
      'rock': 'bg-stone-200 border-stone-300',
      'bug': 'bg-green-200 border-green-300',
      'ghost': 'bg-gray-300 border-gray-400',
      'steel': 'bg-slate-200 border-slate-300',
      'fire': 'bg-red-200 border-red-300',
      'water': 'bg-blue-200 border-blue-300',
      'grass': 'bg-green-200 border-green-300',
      'electric': 'bg-yellow-200 border-yellow-300',
      'psychic': 'bg-pink-200 border-pink-300',
      'ice': 'bg-cyan-200 border-cyan-300',
      'dragon': 'bg-indigo-200 border-indigo-300',
      'dark': 'bg-gray-400 border-gray-500',
      'fairy': 'bg-pink-200 border-pink-300'
    };
    
    const colorClass = typeToColorMap[primaryType] || 'bg-gray-200 border-gray-300';
    console.log(`[DEBUG Background Color] Final color class for ${pokemon.name}:`, colorClass);
    
    return colorClass;
  };

  // Get ranking number color based on position
  const getRankingNumberColor = (index: number): string => {
    if (index === 0) return 'bg-red-500 text-white'; // #1 - Red
    if (index === 1) return 'bg-green-500 text-white'; // #2 - Green  
    if (index === 2) return 'bg-blue-500 text-white'; // #3 - Blue
    if (index === 3) return 'bg-gray-500 text-white'; // #4 - Gray
    if (index === 4) return 'bg-pink-500 text-white'; // #5 - Pink
    if (index === 5) return 'bg-green-400 text-white'; // #6 - Light Green
    if (index === 6) return 'bg-pink-400 text-white'; // #7 - Light Pink
    if (index === 7) return 'bg-green-400 text-white'; // #8 - Light Green
    if (index === 8) return 'bg-gray-400 text-white'; // #9 - Light Gray
    if (index === 9) return 'bg-gray-400 text-white'; // #10 - Light Gray
    if (index === 10) return 'bg-gray-400 text-white'; // #11 - Light Gray
    if (index === 11) return 'bg-yellow-500 text-white'; // #12 - Yellow
    if (index === 12) return 'bg-pink-400 text-white'; // #13 - Light Pink
    if (index === 13) return 'bg-gray-400 text-white'; // #14 - Light Gray
    if (index === 14) return 'bg-gray-500 text-white'; // #15 - Gray
    if (index === 15) return 'bg-blue-400 text-white'; // #16 - Light Blue
    if (index === 16) return 'bg-gray-400 text-white'; // #17 - Light Gray
    if (index === 17) return 'bg-blue-400 text-white'; // #18 - Light Blue
    if (index === 18) return 'bg-green-400 text-white'; // #19 - Light Green
    if (index === 19) return 'bg-green-300 text-white'; // #20 - Lighter Green
    
    // For ranks beyond 20, use a pattern
    const colors = [
      'bg-gray-400 text-white',
      'bg-blue-400 text-white', 
      'bg-green-400 text-white',
      'bg-yellow-400 text-white',
      'bg-pink-400 text-white'
    ];
    return colors[index % colors.length];
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayRankings.map((pokemon, index) => {
            const backgroundColorClass = getPokemonBackgroundColor(pokemon);
            const rankingNumberColor = getRankingNumberColor(index);
            
            return (
              <div 
                key={pokemon.id}
                className={`${backgroundColorClass} rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105 relative`}
                onMouseEnter={() => setHoveredPokemon(pokemon.id)}
                onMouseLeave={() => setHoveredPokemon(null)}
              >
                {/* Ranking number circle - positioned at top left */}
                <div className={`absolute -top-2 -left-2 w-8 h-8 ${rankingNumberColor} rounded-full flex items-center justify-center text-sm font-bold shadow-lg`}>
                  {index + 1}
                </div>
                
                <div className="text-center pt-2">
                  {/* Pokemon image container */}
                  <div className="w-20 h-20 mx-auto mb-3 bg-white/50 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
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
                  
                  {/* Pokemon name */}
                  <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">
                    {pokemon.name}
                  </h3>
                  
                  {/* Pokemon ID */}
                  <div className="text-xs text-gray-600 font-medium">
                    #{pokemon.id}
                  </div>
                  
                  {pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used && (
                    <div className="mt-2 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600 ml-1">Suggested</span>
                    </div>
                  )}
                </div>

                {hoveredPokemon === pokemon.id && onSuggestRanking && (
                  <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                    <button
                      onClick={() => handleSuggestion(pokemon, "up")}
                      className="p-1 bg-green-100 hover:bg-green-200 rounded transition-colors shadow-sm"
                      title="Suggest ranking higher"
                    >
                      <ChevronUp className="w-3 h-3 text-green-600" />
                    </button>
                    
                    <button
                      onClick={() => handleSuggestion(pokemon, "down")}
                      className="p-1 bg-red-100 hover:bg-red-200 rounded transition-colors shadow-sm"
                      title="Suggest ranking lower"
                    >
                      <ChevronDown className="w-3 h-3 text-red-600" />
                    </button>
                    
                    {pokemon.suggestedAdjustment && (
                      <button
                        onClick={() => handleRemoveSuggestion(pokemon.id)}
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors shadow-sm"
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

  // Standard ranking view (non-milestone)
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
