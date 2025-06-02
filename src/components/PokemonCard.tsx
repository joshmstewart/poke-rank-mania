
import React, { useMemo } from "react";
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
  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    const [validated] = validateBattlePokemon([pokemon]);
    return validated;
  }, [pokemon]);

  const pokemonId = validatedPokemon.id;
  const displayName = validatedPokemon.name;
  const imageUrl = validatedPokemon.image;
  const normalizedId = normalizePokedexNumber(pokemonId);

  // Prevent unwanted card clicks
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if click came from info button
    const target = e.target as HTMLElement;
    if (target.closest('[data-info-button="true"]') || target.textContent === 'i') {
      return;
    }
    
    // Don't do anything on card click - let drag handle interactions
    e.preventDefault();
    e.stopPropagation();
  };

  if (viewMode === "grid") {
    // Grid layout: compact vertical layout with image on top, name and number below
    return (
      <Card 
        className={`w-full overflow-hidden relative ${isDragging ? "opacity-50" : ""}`}
        onClick={handleCardClick}
      >
        <div className="absolute top-1 right-1 z-10">
          <PokemonInfoModal pokemon={validatedPokemon} />
        </div>
        
        <div className="flex flex-col p-1">
          {/* Image section */}
          <div className="aspect-square mb-2">
            <PokemonCardImage 
              pokemonId={pokemonId}
              displayName={displayName}
              compact={true}
              imageUrl={imageUrl}
              className="w-full h-full"
            />
          </div>
          
          {/* Name and number section */}
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

  // Original list layout for other views
  return (
    <Card 
      className={`w-full overflow-hidden relative ${isDragging ? "opacity-50" : ""}`}
      onClick={handleCardClick}
    >
      <div className="absolute top-1 right-1 z-10">
        <PokemonInfoModal pokemon={validatedPokemon} />
      </div>
      
      <div className={`flex items-start gap-1 pr-5 ${compact ? "p-1 min-h-[60px]" : "p-1.5 min-h-[70px]"}`}>
        <PokemonCardImage 
          pokemonId={pokemonId}
          displayName={displayName}
          compact={compact}
          imageUrl={imageUrl}
        />
        <div className="flex-1 min-w-0">
          <div className={`flex justify-between items-start ${compact ? "text-xs" : "text-sm"}`}>
            <span className={`font-medium pr-1 flex-1 min-w-0 leading-tight break-words ${compact ? "text-xs" : "text-sm"}`}>
              {displayName}
            </span>
            <span className={`text-gray-500 whitespace-nowrap ml-1 flex-shrink-0 ${compact ? "text-xs" : "text-xs"}`}>
              #{normalizedId}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PokemonCard;
