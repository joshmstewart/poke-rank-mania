
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
  // ULTRA-DETAILED NAME DEBUGGING FOR POKEMON CARD
  console.log(`🎮 [CARD_ULTRA_DEBUG] ===== POKEMON CARD RENDER START =====`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Pokemon ID: ${pokemon.id}`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Received pokemon:`, pokemon);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Original pokemon.name: "${pokemon.name}"`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Original name type: ${typeof pokemon.name}`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Original name length: ${pokemon.name.length}`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Original name chars: [${pokemon.name.split('').join(', ')}]`);

  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    console.log(`🎮 [CARD_ULTRA_DEBUG] About to validate Pokemon:`, pokemon);
    const [validated] = validateBattlePokemon([pokemon]);
    console.log(`🎮 [CARD_ULTRA_DEBUG] Validated result:`, validated);
    console.log(`🎮 [CARD_ULTRA_DEBUG] Validated name: "${validated.name}"`);
    return validated;
  }, [pokemon]);

  // Store the consistent pokemon ID
  const pokemonId = validatedPokemon.id;

  // ULTRA-DETAILED NAME DEBUGGING FOR DISPLAY
  const displayName = validatedPokemon.name; // Use name exactly as provided
  
  console.log(`🎮 [CARD_ULTRA_DEBUG] validatedPokemon.name: "${validatedPokemon.name}"`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Final displayName: "${displayName}"`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] displayName type: ${typeof displayName}`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] displayName chars: [${displayName.split('').join(', ')}]`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] Names are same as original: ${pokemon.name === displayName}`);
  console.log(`🎮 [CARD_ULTRA_DEBUG] validatedPokemon === original: ${validatedPokemon.name === pokemon.name}`);
  
  // Check for any unexpected name changes
  if (pokemon.name !== displayName) {
    console.error(`🚨 [CARD_ULTRA_DEBUG] NAME CHANGED IN POKEMON CARD!`);
    console.error(`🚨 [CARD_ULTRA_DEBUG] Original: "${pokemon.name}"`);
    console.error(`🚨 [CARD_ULTRA_DEBUG] Display: "${displayName}"`);
    console.error(`🚨 [CARD_ULTRA_DEBUG] Validated: "${validatedPokemon.name}"`);
  }
  
  console.log(`🎮 [CARD_ULTRA_DEBUG] ===== POKEMON CARD RENDER END =====`);

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
          imageUrl={validatedPokemon.image}
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
