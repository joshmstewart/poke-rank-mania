
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import PokemonImage from "./PokemonImage";
import PokemonCardInfo from "@/components/pokemon/PokemonCardInfo";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

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
        {/* Info Button - positioned absolutely in top right */}
        <div className="absolute top-1 right-1 z-10">
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
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
        
        {/* Pokemon info - name, number, and types */}
        <div className="mt-auto">
          <PokemonCardInfo
            pokemonId={pokemon.id}
            displayName={pokemon.name}
            types={pokemon.types}
            compact={true}
          />
        </div>
      </div>
    </>
  );
};

export default PokemonCardContent;
