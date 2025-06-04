
import React, { useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import PokemonCardImage from "@/components/pokemon/PokemonCardImage";
import { normalizePokedexNumber } from "@/utils/pokemon";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDragging?: boolean;
  viewMode?: "list" | "grid";
  compact?: boolean;
}

const PokemonCard = ({ pokemon, isDragging, viewMode = "list", compact }: PokemonCardProps) => {
  console.log(`🎯 [POKEMON_CARD] Rendering ${pokemon.name} with viewMode: ${viewMode}, compact: ${compact}`);

  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    const [validated] = validateBattlePokemon([pokemon]);
    return validated;
  }, [pokemon]);

  const pokemonId = validatedPokemon.id;
  const displayName = validatedPokemon.name;
  const imageUrl = validatedPokemon.image;
  const normalizedId = normalizePokedexNumber(pokemonId);

  // Prevent unwanted card clicks during drag operations
  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Check if click came from info button
    const target = e.target as HTMLElement;
    if (target.closest('[data-info-button="true"]') || target.textContent === 'i') {
      return;
    }
    
    // Allow normal interactions when not dragging
    e.preventDefault();
    e.stopPropagation();
  };

  if (viewMode === "grid") {
    return (
      <Card 
        className={`w-full overflow-hidden relative ${isDragging ? "opacity-50 scale-105" : ""}`}
        onClick={handleCardClick}
      >
        <div className="absolute top-1 right-1 z-10">
          <PokemonInfoModal pokemon={validatedPokemon} />
        </div>
        
        <div className="flex flex-col p-1">
          <div className="aspect-square mb-2">
            <PokemonCardImage 
              pokemonId={pokemonId}
              displayName={displayName}
              compact={false}
              imageUrl={imageUrl}
              className="w-full h-full"
            />
          </div>
          
          <div className="text-center px-1">
            <div className="text-xs font-medium leading-tight break-words">
              {displayName}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              #{normalizedId}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // List view (default)
  return (
    <Card 
      className={`flex items-center space-x-3 p-3 hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 scale-105 shadow-lg" : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="absolute top-2 right-2 z-10">
        <PokemonInfoModal pokemon={validatedPokemon} />
      </div>
      
      <div className="flex-shrink-0">
        <PokemonCardImage 
          pokemonId={pokemonId}
          displayName={displayName}
          compact={compact}
          imageUrl={imageUrl}
          className="w-16 h-16"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {displayName}
          </h3>
          <span className="text-sm text-gray-500 flex-shrink-0">
            #{normalizedId}
          </span>
        </div>
        
        {validatedPokemon.types && (
          <div className="flex space-x-1 mt-1">
            {validatedPokemon.types.map((type, index) => (
              <span 
                key={index}
                className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700"
              >
                {type}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PokemonCard;
