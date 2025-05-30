
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { getPreferredImage, ImageType } from "@/utils/imageUtils";
import PokemonInfo from "./PokemonInfo";

interface EnhancedTCGFallbackProps {
  pokemon: Pokemon;
}

const EnhancedTCGFallback: React.FC<EnhancedTCGFallbackProps> = ({ pokemon }) => {
  const preferredImageType: ImageType = 
    (localStorage.getItem('preferredImageType') as ImageType) || 'official';
  
  const imageUrl = getPreferredImage(pokemon, preferredImageType);

  return (
    <div className="space-y-3">
      {/* Fallback to Pokemon artwork without any overlays */}
      <div className="relative">
        <img 
          src={imageUrl}
          alt={pokemon.name}
          className="w-full max-w-[200px] mx-auto rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        
        {/* Enhanced "No TCG Card" badge */}
        <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
          Card Art Unavailable
        </div>
      </div>
      
      <PokemonInfo 
        displayName={pokemon.name}
        pokemonId={pokemon.id}
        types={pokemon.types}
      />
    </div>
  );
};

export default EnhancedTCGFallback;
