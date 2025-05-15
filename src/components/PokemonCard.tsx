
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pokemon } from "@/services/pokemonService";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDragging?: boolean;
  viewMode?: "list" | "grid";
}

// Map of Pokemon types to colors
const typeColors: Record<string, string> = {
  Normal: "bg-gray-400",
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Electric: "bg-yellow-400",
  Grass: "bg-green-500",
  Ice: "bg-blue-200",
  Fighting: "bg-red-700",
  Poison: "bg-purple-600",
  Ground: "bg-yellow-700",
  Flying: "bg-indigo-300",
  Psychic: "bg-pink-500",
  Bug: "bg-lime-500",
  Rock: "bg-stone-500",
  Ghost: "bg-purple-700",
  Dragon: "bg-indigo-600",
  Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400",
  Fairy: "bg-pink-300",
};

const PokemonCard = ({ pokemon, isDragging, viewMode = "list" }: PokemonCardProps) => {
  if (viewMode === "grid") {
    return (
      <div 
        className={`aspect-square relative rounded-md overflow-hidden cursor-grab active:cursor-grabbing ${
          isDragging ? "opacity-50" : "opacity-100"
        }`}
      >
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-2">
          <div className="text-white font-medium">{pokemon.name}</div>
          <div className="text-white/80 text-xs">#{pokemon.id}</div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={`w-full flex items-start p-2 gap-3 cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
        <AspectRatio ratio={1 / 1} className="h-full">
          <img 
            src={pokemon.image} 
            alt={pokemon.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
      </div>
      <CardContent className="p-0 flex-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{pokemon.name}</div>
            <div className="text-xs text-muted-foreground">#{pokemon.id}</div>
          </div>
          
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {pokemon.types.map((type) => (
                <Badge 
                  key={type} 
                  className={`${typeColors[type] || 'bg-gray-500'} text-xs px-2 py-0.5`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}
          
          {pokemon.flavorText && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {pokemon.flavorText}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PokemonCard;
