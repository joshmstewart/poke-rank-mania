
import React, { useState } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import { VotingArrows } from "./VotingArrows";

interface RankingGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  activeTier?: TopNOption;
  isMilestoneView?: boolean;
  battlesCompleted?: number;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-red-500", Water: "bg-blue-500", Electric: "bg-yellow-400",
  Grass: "bg-green-500", Ice: "bg-blue-200", Fighting: "bg-red-700", Poison: "bg-purple-600",
  Ground: "bg-yellow-700", Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-stone-500", Ghost: "bg-purple-700", Dragon: "bg-indigo-600", Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

export const RankingGrid: React.FC<RankingGridProps> = ({
  displayRankings,
  activeTier,
  isMilestoneView = false,
  battlesCompleted = 0,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  console.log(`🔥🔥🔥 [RANKING_GRID_INFO] Rendering ${displayRankings.length} Pokemon`);

  const handleImageLoad = (pokemonId: number) => {
    setLoadedImages(prev => new Set(prev).add(pokemonId));
  };

  const handleImageError = (pokemonId: number) => {
    console.warn(`Failed to load image for Pokemon ${pokemonId}`);
  };

  const handleInfoButtonClick = (pokemon: Pokemon, event: React.MouseEvent) => {
    console.log(`🔥🔥🔥 [INFO_BUTTON_RANKINGS_FIXED] Info button clicked for ${pokemon.name} in Rankings`);
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {displayRankings.map((pokemon, index) => {
        const normalizedId = normalizePokedexNumber(pokemon.id);
        const isRankedPokemon = 'score' in pokemon;
        const isImageLoaded = loadedImages.has(pokemon.id);

        return (
          <div key={pokemon.id} className="relative group">
            {/* CRITICAL FIX: Completely rewritten info button with proper modal integration */}
            <div className="absolute top-1 right-1 z-[100]">
              <PokemonInfoModal pokemon={pokemon}>
                <button 
                  className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={(e) => handleInfoButtonClick(pokemon, e)}
                  onMouseDown={(e) => {
                    console.log(`🔥🔥🔥 [INFO_BUTTON_RANKINGS_FIXED] Info mouse down for ${pokemon.name}`);
                    e.stopPropagation();
                  }}
                  type="button"
                >
                  i
                </button>
              </PokemonInfoModal>
            </div>

            {/* Voting arrows for ranked Pokemon */}
            {isRankedPokemon && onSuggestRanking && onRemoveSuggestion && (
              <VotingArrows
                pokemon={pokemon as RankedPokemon}
                onSuggestRanking={onSuggestRanking}
                onRemoveSuggestion={onRemoveSuggestion}
              />
            )}

            {/* Card with no click handlers that could interfere */}
            <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Rank number */}
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-center py-1">
                <span className="text-sm font-bold">#{index + 1}</span>
              </div>

              {/* Pokemon image */}
              <div className="aspect-square bg-gray-50 p-2 relative">
                {!isImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={pokemon.image}
                  alt={pokemon.name}
                  className={`w-full h-full object-contain transition-opacity ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => handleImageLoad(pokemon.id)}
                  onError={() => handleImageError(pokemon.id)}
                  loading="lazy"
                />
              </div>

              {/* Pokemon info */}
              <div className="p-2 space-y-1">
                <h3 className="text-sm font-semibold text-center line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                  {pokemon.name}
                </h3>
                
                <div className="text-xs text-gray-500 text-center">
                  #{normalizedId}
                </div>

                {/* Types */}
                {pokemon.types && pokemon.types.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {pokemon.types.map(type => (
                      <Badge 
                        key={type} 
                        className={`${typeColors[type]} text-white text-xs px-1 py-0.5 h-auto`}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Score for ranked Pokemon */}
                {isRankedPokemon && 'score' in pokemon && (
                  <div className="text-xs text-center text-gray-600">
                    Score: {pokemon.score.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
