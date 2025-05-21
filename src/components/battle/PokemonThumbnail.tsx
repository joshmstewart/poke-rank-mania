
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonTypeColor } from "./utils/pokemonTypeColors";
import { getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";

interface PokemonThumbnailProps {
  pokemon: Pokemon;
  index: number;
}

const PokemonThumbnail: React.FC<PokemonThumbnailProps> = ({ pokemon, index }) => {
  const typeColor = getPokemonTypeColor(pokemon);
  
  return (
    <div className="relative flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Rank number with type-colored background */}
      <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
        <span className="text-sm font-bold">{index + 1}</span>
      </div>
      
      {/* Pokemon image in center - more compact */}
      <div className={`p-1 flex items-center justify-center ${typeColor} bg-opacity-20`}>
        <div className="w-full aspect-square relative flex items-center justify-center max-h-20">
          <img 
            src={getPreferredImageUrl(pokemon.id)} 
            alt={pokemon.name} 
            className="object-contain max-h-16 p-1"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Try a fallback if first image fails
              target.src = getPreferredImageUrl(pokemon.id, 1);
            }}
          />
        </div>
      </div>
      
      {/* Pokemon info at bottom */}
      <div className="py-1 px-2 text-center border-t border-gray-100">
        <div className="font-medium text-xs truncate">{pokemon.name}</div>
        <div className="text-xs text-muted-foreground">#{pokemon.id}</div>
      </div>
    </div>
  );
};

export default PokemonThumbnail;
