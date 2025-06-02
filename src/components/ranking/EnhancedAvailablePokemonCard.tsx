
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import PokemonCardImage from "@/components/pokemon/PokemonCardImage";
import PokemonCardInfo from "@/components/pokemon/PokemonCardInfo";

interface EnhancedPokemon {
  id: number;
  name: string;
  image: string;
  types?: string[];
  isRanked: boolean;
  currentRank: number | null;
  score: number;
  count: number;
  confidence: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface EnhancedAvailablePokemonCardProps {
  pokemon: EnhancedPokemon;
}

// Generate consistent card colors based on Pokemon ID
const getCardBackgroundColor = (pokemonId: number, isRanked: boolean) => {
  if (isRanked) {
    return "bg-yellow-100"; // Special color for ranked Pokemon
  }
  
  // Generate consistent colors for unranked Pokemon
  const colors = [
    "bg-red-100",
    "bg-blue-100", 
    "bg-green-100",
    "bg-purple-100",
    "bg-pink-100",
    "bg-indigo-100",
    "bg-teal-100",
    "bg-orange-100",
    "bg-cyan-100",
    "bg-emerald-100"
  ];
  
  return colors[pokemonId % colors.length];
};

export const EnhancedAvailablePokemonCard: React.FC<EnhancedAvailablePokemonCardProps> = React.memo(({
  pokemon
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `available-${pokemon.id}`,
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      isRanked: pokemon.isRanked
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const backgroundColor = getCardBackgroundColor(pokemon.id, pokemon.isRanked);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative cursor-grab active:cursor-grabbing transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 z-50' : 'hover:scale-102 hover:shadow-lg'}
      `}
    >
      <Card className={`${backgroundColor} relative group hover:shadow-lg transition-shadow border border-gray-200`}>
        {/* Info Button - positioned like rankings */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal pokemon={pokemon} />
        </div>
        
        {/* Rank Badge for Ranked Pokemon */}
        {pokemon.isRanked && pokemon.currentRank && (
          <div className="absolute top-2 left-2 z-20">
            <Badge 
              variant="secondary" 
              className="bg-yellow-500 text-white font-bold text-xs px-2 py-1 shadow-md flex items-center gap-1"
            >
              <Crown size={12} />
              #{pokemon.currentRank}
            </Badge>
          </div>
        )}
        
        {/* Re-rank Indicator */}
        {pokemon.isRanked && (
          <div className="absolute top-2 right-8 z-20">
            <Badge 
              variant="outline" 
              className="bg-blue-100 text-blue-700 text-xs px-1 py-0.5 font-medium"
            >
              Re-rank
            </Badge>
          </div>
        )}

        <div className="p-4 cursor-pointer">
          <PokemonCardImage 
            pokemonId={pokemon.id}
            displayName={pokemon.name}
            imageUrl={pokemon.image}
            className="mb-2"
          />
          <PokemonCardInfo 
            pokemonId={pokemon.id}
            displayName={pokemon.name}
            types={pokemon.types}
            flavorText=""
            compact={false}
          />
          
          {/* Score display for ranked Pokemon - matching rankings style */}
          {pokemon.isRanked && (
            <div className="mt-2 text-center">
              <div className="text-xs text-gray-600">
                Score: {pokemon.score.toFixed(1)}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

EnhancedAvailablePokemonCard.displayName = 'EnhancedAvailablePokemonCard';
