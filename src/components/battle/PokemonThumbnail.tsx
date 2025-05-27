
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
  // ULTRA-DETAILED DEBUGGING: Track every step of name handling
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] ===== POKEMON THUMBNAIL RENDER START =====`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon ID: ${pokemon.id}`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Received pokemon object:`, pokemon);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name property:`, pokemon.name);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name type:`, typeof pokemon.name);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name length:`, pokemon.name.length);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name chars: [${pokemon.name.split('').join(', ')}]`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name contains hyphen:`, pokemon.name.includes('-'));
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name is mega form:`, pokemon.name.toLowerCase().includes('-mega'));
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] Pokemon name is alolan form:`, pokemon.name.toLowerCase().includes('-alola'));
  
  // Use the name EXACTLY as provided - NO MORE RE-FORMATTING
  const displayName = pokemon.name;
  
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] displayName assignment: "${displayName}"`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] displayName === pokemon.name: ${displayName === pokemon.name}`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] displayName type: ${typeof displayName}`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] displayName chars: [${displayName.split('').join(', ')}]`);
  
  // Check for any unexpected transformations
  if (displayName !== pokemon.name) {
    console.error(`🚨 [THUMBNAIL_ULTRA_DEBUG] CRITICAL: displayName differs from pokemon.name!`);
    console.error(`🚨 [THUMBNAIL_ULTRA_DEBUG] Original: "${pokemon.name}"`);
    console.error(`🚨 [THUMBNAIL_ULTRA_DEBUG] Display: "${displayName}"`);
  }
  
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] About to render with displayName: "${displayName}"`);
  console.log(`🎯 [THUMBNAIL_ULTRA_DEBUG] ===== POKEMON THUMBNAIL RENDER END =====`);

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
