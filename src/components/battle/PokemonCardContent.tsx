
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

  console.log(`🔘 [CARD_CONTENT_DEBUG] Rendering ${pokemon.name} - ID: ${pokemon.id}, normalizedId: ${normalizedId}`);

  const handleInfoClick = (e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] Info button clicked for ${pokemon.name}`);
    e.preventDefault();
    e.stopPropagation();
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
        {/* Info Button - positioned to not interfere with drag */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-6 h-6 rounded-full bg-white/90 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200"
              onClick={handleInfoClick}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
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
        
        {/* Pokemon info section - name, number, and types */}
        <div className="mt-auto bg-white/95 rounded-md p-2 border border-gray-200/50">
          {/* Name and ID row */}
          <div className="flex justify-between items-start mb-1">
            <div className="text-sm font-semibold text-gray-900 flex-1 pr-2 leading-tight">
              {pokemon.name}
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              #{normalizedId}
            </div>
          </div>
          
          {/* Types */}
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {pokemon.types.map(type => {
                const colorClass = typeColors[type] || typeColors[type.toLowerCase()] || "bg-gray-400";
                return (
                  <Badge 
                    key={type} 
                    variant="secondary"
                    className={`${colorClass} text-white border-0 font-medium text-xs px-1.5 py-0.5 h-auto`}
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
