
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemonService";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDragging?: boolean;
}

const PokemonCard = ({ pokemon, isDragging }: PokemonCardProps) => {
  return (
    <Card 
      className={`w-full flex items-center p-2 gap-3 cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
        <img 
          src={pokemon.image} 
          alt={pokemon.name} 
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      <CardContent className="p-0 flex-1">
        <div className="font-medium">{pokemon.name}</div>
        <div className="text-xs text-muted-foreground">#{pokemon.id}</div>
      </CardContent>
    </Card>
  );
};

export default PokemonCard;
