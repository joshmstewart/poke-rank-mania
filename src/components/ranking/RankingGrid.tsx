
import React, { useState, useCallback } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import ShowMoreButton from "../battle/ShowMoreButton";
import { Button } from "@/components/ui/button";
import { getPokemonTypeColor } from "../battle/utils/pokemonTypeColors";

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

  // CRITICAL FIX: Enhanced Pokemon background color based on primary type
  const getPokemonBackgroundColor = (pokemon: RankedPokemon): string => {
    console.log(`[DEBUG Background Color] Pokemon ${pokemon.name} types:`, pokemon.types);
    
    if (!pokemon.types || pokemon.types.length === 0 || pokemon.types[0] === 'unknown') {
      return 'bg-gray-100'; // Default fallback
    }
    
    const primaryType = pokemon.types[0].toLowerCase();
    console.log(`[DEBUG Background Color] Primary type for ${pokemon.name}:`, primaryType);
    
    // CRITICAL TYPE COLOR MAPPING: Enhanced color mapping for milestone cards
    const typeToColorMap: Record<string, string> = {
      'normal': 'bg-amber-100 border-amber-200',
      'fighting': 'bg-red-200 border-red-300',
      'flying': 'bg-blue-100 border-blue-200',
      'poison': 'bg-purple-200 border-purple-300',
      'ground': 'bg-yellow-200 border-yellow-300',
      'rock': 'bg-stone-200 border-stone-300',
      'bug': 'bg-green-200 border-green-300',
      'ghost': 'bg-gray-300 border-gray-400',
      'steel': 'bg-slate-200 border-slate-300',
      'fire': 'bg-red-100 border-red-200',
      'water': 'bg-blue-200 border-blue-300',
      'grass': 'bg-green-100 border-green-200',
      'electric': 'bg-yellow-100 border-yellow-200',
      'psychic': 'bg-pink-200 border-pink-300',
      'ice': 'bg-cyan-100 border-cyan-200',
      'dragon': 'bg-indigo-200 border-indigo-300',
      'dark': 'bg-gray-400 border-gray-500',
      'fairy': 'bg-pink-100 border-pink-200'
    };
    
    const colorClass = typeToColorMap[primaryType] || 'bg-gray-100 border-gray-200';
    console.log(`[DEBUG Background Color] Final color class for ${pokemon.name}:`, colorClass);
    
    return colorClass;
  };

  if (isMilestoneView) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Milestone Reached!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            You've completed {battlesCompleted} battles. Here are your current rankings:
          </p>
          
          {onContinueBattles && (
            <Button 
              onClick={onContinueBattles}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Continue Battles
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayRankings.map((pokemon, index) => {
            const backgroundColorClass = getPokemonBackgroundColor(pokemon);
            
            return (
              <div 
                key={pokemon.id}
                className={`${backgroundColorClass} rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105`}
                onMouseEnter={() => setHoveredPokemon(pokemon.id)}
                onMouseLeave={() => setHoveredPokemon(null)}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    #{index + 1}
                  </div>
                  
                  <div className="w-20 h-20 mx-auto mb-3 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm">
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
                  
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">
                    {pokemon.name}
                  </h3>
                  
                  <div className="text-xs text-gray-600 mb-2 font-medium">
                    {pokemon.types?.join(' / ') || 'Unknown'}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Score: {Math.round(pokemon.score || 0)}
                  </div>
                  
                  {pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used && (
                    <div className="mt-2 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600 ml-1">Suggested</span>
                    </div>
                  )}
                </div>

                {hoveredPokemon === pokemon.id && onSuggestRanking && (
                  <div className="mt-3 flex justify-center gap-1">
                    <button
                      onClick={() => handleSuggestion(pokemon, "up")}
                      className="p-1 bg-green-100 hover:bg-green-200 rounded transition-colors"
                      title="Suggest ranking higher"
                    >
                      <ChevronUp className="w-3 h-3 text-green-600" />
                    </button>
                    
                    <button
                      onClick={() => handleSuggestion(pokemon, "down")}
                      className="p-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
                      title="Suggest ranking lower"
                    >
                      <ChevronDown className="w-3 h-3 text-red-600" />
                    </button>
                    
                    {pokemon.suggestedAdjustment && (
                      <button
                        onClick={() => handleRemoveSuggestion(pokemon.id)}
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {displayRankings.map((pokemon, index) => (
        <div 
          key={pokemon.id}
          className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-200 hover:shadow-lg"
          onMouseEnter={() => setHoveredPokemon(pokemon.id)}
          onMouseLeave={() => setHoveredPokemon(null)}
        >
          {/* Standard ranking view content */}
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
