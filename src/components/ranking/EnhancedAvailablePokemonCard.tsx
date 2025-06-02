
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import PokemonCardContent from "@/components/battle/PokemonCardContent";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface EnhancedPokemon {
  id: number;
  name: string;
  image?: string;
  types?: string[];
  isRanked: boolean;
  currentRank: number | null;
  // Add missing properties to satisfy Pokemon/RankedPokemon type requirements
  score?: number;
  count?: number;
  confidence?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
}

interface EnhancedAvailablePokemonCardProps {
  pokemon: EnhancedPokemon;
}

export const EnhancedAvailablePokemonCard: React.FC<EnhancedAvailablePokemonCardProps> = ({
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

  console.log(`🎴 [ENHANCED_CARD] Rendering ${pokemon.name} - isRanked: ${pokemon.isRanked}, rank: ${pokemon.currentRank}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative cursor-grab active:cursor-grabbing transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 z-50' : 'hover:scale-102 hover:shadow-lg'}
        ${pokemon.isRanked ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
      `}
    >
      {/* Ranked Pokemon Overlay */}
      {pokemon.isRanked && (
        <div className="absolute inset-0 bg-yellow-100 bg-opacity-30 rounded-lg pointer-events-none z-10" />
      )}
      
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
        <div className="absolute top-2 right-2 z-20">
          <Badge 
            variant="outline" 
            className="bg-blue-100 text-blue-700 text-xs px-1 py-0.5 font-medium"
          >
            Re-rank
          </Badge>
        </div>
      )}

      {/* Pokemon Card Content */}
      <div className={`relative ${pokemon.isRanked ? 'opacity-90' : ''}`}>
        <PokemonCardContent
          pokemon={pokemon}
          index={0}
          showRank={false}
        />
      </div>
    </div>
  );
};
