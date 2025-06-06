
import React from "react";
import { Pokemon } from "@/services/pokemon";

// Helper function to safely format Pokemon names without filtering
const safeFormatPokemonName = (name: string): string => {
  if (!name) return '';
  
  // Simple capitalization without any filtering logic
  return name.split(/(\s+|-+)/).map(part => {
    if (part.match(/^\s+$/) || part.match(/^-+$/)) {
      return part; // Keep whitespace and hyphens as-is
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
};

interface PokemonCardInfoProps {
  pokemonId: number;
  displayName: string;
  types: string[];
  flavorText?: string;
}

const PokemonCardInfo: React.FC<PokemonCardInfoProps> = ({
  pokemonId,
  displayName,
  types,
  flavorText
}) => {
  // CRITICAL FIX: Apply formatting to the display name
  const formattedName = safeFormatPokemonName(displayName);
  
  console.log(`🎨 [POKEMON_CARD_INFO_FORMAT] Formatting ${displayName} -> ${formattedName}`);

  return (
    <div className="mt-2">
      <h3 className="text-sm font-semibold text-gray-800 truncate">
        {formattedName}
      </h3>
      <div className="flex gap-1 mt-1">
        {types.map((type: string) => (
          <span
            key={type}
            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
          >
            {type}
          </span>
        ))}
      </div>
      {flavorText && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {flavorText}
        </p>
      )}
    </div>
  );
};

export default PokemonCardInfo;
