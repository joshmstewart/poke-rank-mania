
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
  // CRITICAL DEBUGGING: Use the name EXACTLY as provided - NO MORE RE-FORMATTING
  const displayName = pokemon.name;
  
  // CRITICAL DEBUGGING: Log exactly what name we're receiving and displaying
  console.log(`🎯 [THUMBNAIL_CRITICAL_DEBUG] Pokemon ID: ${pokemon.id}`);
  console.log(`🎯 [THUMBNAIL_CRITICAL_DEBUG] Raw pokemon.name received: "${pokemon.name}"`);
  console.log(`🎯 [THUMBNAIL_CRITICAL_DEBUG] Final displayName (NO FORMATTING): "${displayName}"`);
  console.log(`🎯 [THUMBNAIL_CRITICAL_DEBUG] Name contains hyphen: ${displayName.includes('-')}`);
  console.log(`🎯 [THUMBNAIL_CRITICAL_DEBUG] Name is mega form: ${displayName.toLowerCase().includes('-mega')}`);
  console.log(`🎯 [THUMBNAIL_CRITICAL_DEBUG] Expected format for mega: Should be "Mega [Name]" not "[Name]-mega"`);

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
