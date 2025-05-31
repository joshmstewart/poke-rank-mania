
import React, { useState } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import { VotingArrows } from "./VotingArrows";

interface RankingGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  activeTier?: any;
  isMilestoneView?: boolean;
  battlesCompleted?: number;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

export const RankingGrid: React.FC<RankingGridProps> = ({
  displayRankings,
  activeTier,
  isMilestoneView = false,
  battlesCompleted = 0,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  console.log(`🔥🔥🔥 [RANKING_GRID_RENDER] Rendering ${displayRankings.length} Pokemon in Rankings grid`);

  const handleImageLoad = (pokemonId: number) => {
    setLoadedImages(prev => new Set(prev).add(pokemonId));
  };

  const handleImageError = (pokemonId: number) => {
    console.warn(`Failed to load image for Pokemon ${pokemonId}`);
  };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {displayRankings.map((pokemon, index) => {
        const normalizedId = normalizePokedexNumber(pokemon.id);
        const isRankedPokemon = 'score' in pokemon;
        const isImageLoaded = loadedImages.has(pokemon.id);

        // CRITICAL FIX: Info button state management
        const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

        const handleInfoClick = (e: React.MouseEvent) => {
          console.log(`🔘🔘🔘 [RANKING_INFO_CLICK_DETAILED] Info button clicked for ${pokemon.name} in Rankings`);
          e.stopPropagation();
          e.preventDefault();
          
          console.log(`🔘🔘🔘 [RANKING_INFO_MODAL_ATTEMPT] Attempting to open modal for ${pokemon.name}`);
          setIsInfoModalOpen(true);
          console.log(`🔘🔘🔘 [RANKING_INFO_MODAL_STATE] Modal state set to open for ${pokemon.name}`);
        };

        const handleModalOpenChange = (open: boolean) => {
          console.log(`🔘🔘🔘 [RANKING_INFO_MODAL_CHANGE] Modal ${open ? 'opened' : 'closed'} for ${pokemon.name} in Rankings`);
          setIsInfoModalOpen(open);
        };

        return (
          <div key={pokemon.id} className="relative group">
            {/* CRITICAL FIX: Info button with complete isolation and state management */}
            <div 
              className="absolute top-1 right-1 z-50"
              style={{ 
                pointerEvents: 'auto',
                position: 'absolute',
                zIndex: 9999
              }}
            >
              <PokemonInfoModal 
                pokemon={pokemon}
                onOpenChange={handleModalOpenChange}
              >
                <button 
                  className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200"
                  onClick={handleInfoClick}
                  onPointerDown={(e) => {
                    console.log(`🔘🔘🔘 [RANKING_INFO_POINTER_DOWN] Info button pointer down for ${pokemon.name}`);
                    e.stopPropagation();
                  }}
                  type="button"
                  data-info-button="true"
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

            {/* Card with no interfering event handlers */}
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
