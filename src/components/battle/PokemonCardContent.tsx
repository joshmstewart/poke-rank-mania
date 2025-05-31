
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import PokemonImage from "./PokemonImage";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { Badge } from "@/components/ui/badge";
import { typeColors } from "@/utils/pokemon/typeColors";

interface PokemonCardContentProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
}

const PokemonCardContent: React.FC<PokemonCardContentProps> = ({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true
}) => {
  const normalizedId = normalizePokedexNumber(pokemon.id);

  const handleInfoButtonClick = (e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] PokemonCardContent: Info button clicked for ${pokemon.name}`);
    e.preventDefault();
    e.stopPropagation();
    // Don't call any other handlers - let the modal handle it
  };

  return (
    <>
      {/* Rank number - only show if showRank is true */}
      {showRank && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-center py-1 px-2 flex-shrink-0">
          <span className="text-sm font-bold">#{index + 1}</span>
        </div>
      )}
      
      {/* Pokemon image and info container */}
      <div className="flex-1 p-2 flex flex-col relative">
        {/* Info Button - positioned absolutely in top right with better event handling */}
        <div 
          className="absolute top-1 right-1 z-10"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
              onClick={handleInfoButtonClick}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              data-info-button="true"
            >
              i
            </button>
          </PokemonInfoModal>
        </div>

        {/* Pokemon image */}
        <div className="flex-1 flex items-center justify-center mb-2">
          <PokemonImage 
            imageUrl={pokemon.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
            displayName={pokemon.name}
            pokemonId={pokemon.id}
          />
        </div>
        
        {/* Pokemon info - name, number, and types with explicit styling */}
        <div className="mt-auto bg-white/90 rounded p-2">
          <div className="flex justify-between items-start text-xs">
            <span className="font-medium text-gray-900 flex-1 leading-tight break-words">
              {pokemon.name}
            </span>
            <span className="text-gray-500 whitespace-nowrap ml-1 flex-shrink-0">
              #{normalizedId}
            </span>
          </div>
          {pokemon.types?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {pokemon.types.map(type => {
                const colorClass = typeColors[type] || typeColors[type.toLowerCase()] || "bg-gray-400";
                return (
                  <Badge 
                    key={type} 
                    variant="secondary"
                    className={`${colorClass} text-white border-0 font-medium text-xs px-1.5 py-0.5`}
                  >
                    {type}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PokemonCardContent;
