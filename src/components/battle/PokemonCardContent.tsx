
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import PokemonImage from "./PokemonImage";
import PokemonCardInfo from "@/components/pokemon/PokemonCardInfo";

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
      
      {/* Pokemon image */}
      <div className="flex-1 p-2 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <PokemonImage 
            pokemon={pokemon} 
            compact={true}
            className="w-16 h-16 object-contain"
          />
        </div>
        
        {/* Pokemon info */}
        <div className="mt-2">
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
