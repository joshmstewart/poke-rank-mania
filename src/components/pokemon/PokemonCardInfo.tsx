
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
      <div className={`flex justify-between items-start ${compact ? "text-xs" : "text-sm"}`}>
        <span className={`font-medium pr-2 flex-1 min-w-0 leading-tight break-words ${compact ? "text-xs" : "text-sm"}`}>
          {displayName}
        </span>
        <span className={`text-gray-500 whitespace-nowrap ml-1 flex-shrink-0 ${compact ? "text-xs" : "text-xs"}`}>
          #{normalizedId}
        </span>
      </div>
      {types?.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {types.map(type => {
            const colorClass = typeColors[type] || typeColors[type.toLowerCase()] || "bg-gray-400";
            return (
              <Badge 
                key={type} 
                variant="secondary"
                className={`${colorClass} text-white border-0 font-medium ${compact ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"}`}
              >
                {type}
              </Badge>
            );
          })}
        </div>
      )}
      {!compact && flavorText && (
        <div className={`mt-1.5 line-clamp-2 text-muted-foreground leading-relaxed ${compact ? "text-xs" : "text-xs"}`}>
          {flavorText}
        </div>
      )}
    </div>
  );
};

export default PokemonCardInfo;
