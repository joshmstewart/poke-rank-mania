
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
    <div className="flex-1 min-w-0">
      <div className={`flex justify-between items-start ${compact ? "text-sm" : "text-base"}`}>
        <span className="font-medium pr-2 break-words">{displayName}</span>
        <span className="text-xs text-right whitespace-nowrap ml-2 flex-shrink-0">#{normalizedId}</span>
      </div>
      {types?.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {types.map(type => (
            <Badge 
              key={type} 
              className={`${typeColors[type]} text-white text-xs px-1.5 py-0.5 border-0`}
              style={{ 
                backgroundColor: typeColors[type]?.includes('bg-') ? undefined : typeColors[type],
                color: type === 'Dark' ? 'white' : undefined
              }}
            >
              {type}
            </Badge>
          ))}
        </div>
      )}
      {!compact && flavorText && <div className="text-xs mt-1 line-clamp-2 text-muted-foreground">{flavorText}</div>}
    </div>
  );
};

export default PokemonCardInfo;
