
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
  console.log(`🎮 [POKEMON_CARD_SIMPLE] Rendering ${pokemon.name} with image: ${pokemon.image}`);

  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    const [validated] = validateBattlePokemon([pokemon]);
    console.log(`🎮 [POKEMON_CARD_SIMPLE] Validated ${pokemon.name}: image=${validated.image}`);
    return validated;
  }, [pokemon]);

  const pokemonId = validatedPokemon.id;
  const displayName = validatedPokemon.name;
  const imageUrl = validatedPokemon.image;
  
  console.log(`🎮 [POKEMON_CARD_SIMPLE] Final render values:`, { pokemonId, displayName, imageUrl });

  return (
    <Card className={`w-full overflow-hidden relative ${isDragging ? "opacity-50" : ""}`}>
      <div className="absolute top-1 right-1 z-10">
        <PokemonInfoModal pokemon={validatedPokemon} />
      </div>
      
      <div className="flex items-start p-3 gap-3 pr-8">
        <PokemonCardImage 
          pokemonId={pokemonId}
          displayName={displayName}
          compact={compact}
          imageUrl={imageUrl}
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
