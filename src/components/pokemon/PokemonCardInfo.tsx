
import React from "react";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { typeColors } from "@/utils/pokemon/typeColors";

interface PokemonCardInfoProps {
  pokemonId: number;
  displayName: string;
  types?: string[];
  flavorText?: string;
  compact?: boolean;
}

const PokemonCardInfo: React.FC<PokemonCardInfoProps> = ({
  pokemonId,
  displayName,
  types,
  flavorText,
  compact = false
}) => {
  const normalizedId = normalizePokedexNumber(pokemonId);

  return (
    <div className="flex-1 min-w-0 min-h-0">
      <div className={`flex justify-between items-start ${compact ? "text-sm" : "text-base"}`}>
        <span className="font-medium pr-3 flex-1 min-w-0 leading-tight">{displayName}</span>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex-shrink-0">#{normalizedId}</span>
      </div>
      {types?.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {types.map(type => {
            const colorClass = typeColors[type] || typeColors[type.toLowerCase()] || "bg-gray-400";
            return (
              <Badge 
                key={type} 
                className={`${colorClass} text-white text-xs px-2 py-1 border-0 font-medium`}
              >
                {type}
              </Badge>
            );
          })}
        </div>
      )}
      {!compact && flavorText && (
        <div className="text-xs mt-2 line-clamp-2 text-muted-foreground leading-relaxed">
          {flavorText}
        </div>
      )}
    </div>
  );
};

export default PokemonCardInfo;
