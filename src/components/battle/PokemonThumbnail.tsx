
import React from "react";
import { Pokemon } from "@/services/pokemon";

interface PokemonThumbnailProps {
  pokemon: Pokemon;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  showName?: boolean;
  disabled?: boolean;
}

const PokemonThumbnail: React.FC<PokemonThumbnailProps> = ({
  pokemon,
  isSelected = false,
  onClick,
  className = "",
  showName = true,
  disabled = false
}) => {
  // CRITICAL: Track exactly where names are coming from
  console.log(`🎯 [THUMBNAIL_CRITICAL] ===== POKEMON THUMBNAIL FOR ${pokemon.id} =====`);
  console.log(`🎯 [THUMBNAIL_CRITICAL] Raw pokemon object received:`, pokemon);
  console.log(`🎯 [THUMBNAIL_CRITICAL] pokemon.name property: "${pokemon.name}"`);
  console.log(`🎯 [THUMBNAIL_CRITICAL] pokemon.name is formatted: ${!pokemon.name.includes('-') || pokemon.name.includes('(') || pokemon.name.includes('Mega ') || pokemon.name.includes('Alolan ')}`);
  
  // Check if this is an unformatted name that should have been formatted
  const shouldBeFormatted = pokemon.name.includes('-') && !pokemon.name.includes('(') && !pokemon.name.includes('Mega ') && !pokemon.name.includes('Alolan ') && !pokemon.name.includes('Galarian ') && !pokemon.name.includes('Hisuian ');
  
  if (shouldBeFormatted) {
    console.error(`🚨 [THUMBNAIL_CRITICAL] UNFORMATTED NAME DETECTED: "${pokemon.name}" (ID: ${pokemon.id})`);
    console.error(`🚨 [THUMBNAIL_CRITICAL] This name should have been formatted but wasn't!`);
    console.error(`🚨 [THUMBNAIL_CRITICAL] Pokemon object source analysis:`, {
      hasId: !!pokemon.id,
      hasName: !!pokemon.name,
      hasImage: !!pokemon.image,
      hasTypes: !!pokemon.types,
      objectKeys: Object.keys(pokemon),
      nameContainsHyphen: pokemon.name.includes('-'),
      nameStartsWithLowercase: pokemon.name[0] === pokemon.name[0].toLowerCase()
    });
  }
  
  const displayName = pokemon.name;
  
  console.log(`🎯 [THUMBNAIL_CRITICAL] Final displayName for render: "${displayName}"`);
  console.log(`🎯 [THUMBNAIL_CRITICAL] ===== END THUMBNAIL ${pokemon.id} =====`);

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-200 
        ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
    >
      <div className="aspect-square bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <img
          src={pokemon.image}
          alt={displayName}
          className="w-full h-full object-contain p-2"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {showName && (
        <div className="text-center mt-1">
          <h3 className="text-xs font-medium text-gray-800 line-clamp-2">
            {displayName}
          </h3>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
};

export default PokemonThumbnail;
