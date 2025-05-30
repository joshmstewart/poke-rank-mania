
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import PokemonCardImage from "@/components/pokemon/PokemonCardImage";
import PokemonCardInfo from "@/components/pokemon/PokemonCardInfo";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDragging?: boolean;
  viewMode?: "list" | "grid";
  compact?: boolean;
}

const PokemonCard = ({ pokemon, isDragging, compact }: PokemonCardProps) => {
  console.log(`🎮 [MANUAL_MODE_DEBUG] ===== POKEMON CARD RENDER START =====`);
  console.log(`🎮 [MANUAL_MODE_DEBUG] Pokemon ID: ${pokemon.id}, Name: ${pokemon.name}`);
  console.log(`🎮 [MANUAL_MODE_DEBUG] Pokemon object:`, {
    id: pokemon.id,
    name: pokemon.name,
    image: pokemon.image,
    hasImage: !!pokemon.image,
    imageLength: pokemon.image?.length || 0
  });

  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    console.log(`🎮 [MANUAL_MODE_DEBUG] Validating Pokemon:`, pokemon);
    const [validated] = validateBattlePokemon([pokemon]);
    console.log(`🎮 [MANUAL_MODE_DEBUG] Validated result:`, {
      id: validated.id,
      name: validated.name,
      image: validated.image,
      hasImage: !!validated.image
    });
    return validated;
  }, [pokemon]);

  // Store the consistent pokemon ID
  const pokemonId = validatedPokemon.id;

  // Use name exactly as provided
  const displayName = validatedPokemon.name;
  
  console.log(`🎮 [MANUAL_MODE_DEBUG] Final values:`, {
    pokemonId,
    displayName,
    validatedImage: validatedPokemon.image
  });
  
  console.log(`🎮 [MANUAL_MODE_DEBUG] ===== POKEMON CARD RENDER END =====`);

  return (
    <Card className={`w-full overflow-hidden relative ${isDragging ? "opacity-50" : ""}`}>
      {/* Info Button - ensure it's visible and properly positioned */}
      <div className="absolute top-2 right-2 z-10">
        <PokemonInfoModal pokemon={validatedPokemon} />
      </div>
      
      <div className="flex items-start p-3 gap-3">
        <PokemonCardImage 
          pokemonId={pokemonId}
          displayName={displayName}
          compact={compact}
        />
        <PokemonCardInfo 
          pokemonId={pokemonId}
          displayName={displayName}
          types={validatedPokemon.types}
          flavorText={validatedPokemon.flavorText}
          compact={compact}
        />
      </div>
    </Card>
  );
};

export default PokemonCard;
