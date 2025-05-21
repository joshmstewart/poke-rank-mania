
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonTypeColor } from "./utils/pokemonTypeColors";
import { getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";
import { normalizePokedexNumber, capitalizeSpecialForms } from "@/utils/pokemonUtils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getPokemonGeneration } from "@/components/ranking/rankingUtils";

interface PokemonThumbnailProps {
  pokemon: Pokemon;
  index: number;
}

const PokemonThumbnail: React.FC<PokemonThumbnailProps> = ({ pokemon, index }) => {
  const typeColor = getPokemonTypeColor(pokemon);
  const normalizedId = normalizePokedexNumber(pokemon.id);
  const formattedName = capitalizeSpecialForms(pokemon.name);
  const generation = getPokemonGeneration(pokemon.id);
  
  return (
    <HoverCard openDelay={0} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div className="relative flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          {/* Rank number with type-colored background */}
          <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
            <span className="text-sm font-bold">{index + 1}</span>
          </div>
          
          {/* Pokemon image in center - more compact */}
          <div className={`p-1 flex items-center justify-center ${typeColor} bg-opacity-20`}>
            <div className="w-full aspect-square relative flex items-center justify-center max-h-20">
              <img 
                src={getPreferredImageUrl(pokemon.id)} 
                alt={formattedName} 
                className="object-contain max-h-16 p-1"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Try a fallback if first image fails
                  target.src = getPreferredImageUrl(pokemon.id, 1);
                }}
              />
            </div>
          </div>
          
          {/* Pokemon info at bottom */}
          <div className="py-1 px-2 text-center border-t border-gray-100">
            <div className="font-medium text-xs truncate">{formattedName}</div>
            <div className="text-xs text-muted-foreground">#{normalizedId}</div>
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-64" align="center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={pokemon.image} 
              alt={formattedName}
              className="w-12 h-12 object-contain"
            />
            <div>
              <h4 className="font-semibold">{formattedName}</h4>
              <div className="text-xs text-muted-foreground">
                #{normalizedId} • {generation?.name || "Unknown"}
              </div>
              {pokemon.types && (
                <div className="flex gap-1 mt-1">
                  {pokemon.types.map(type => (
                    <span 
                      key={type} 
                      className="text-xs px-1.5 py-0.5 rounded bg-gray-100"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid gap-1.5">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Battles:</span>
                <span>{pokemon.count || "N/A"}</span>
              </div>
              {pokemon.score !== undefined && (
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="font-mono">{pokemon.score?.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default PokemonThumbnail;
