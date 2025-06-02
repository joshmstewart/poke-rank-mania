
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import PokemonCardImage from "@/components/pokemon/PokemonCardImage";
import { getPokemonTypeColor } from "@/components/battle/utils/pokemonTypeColors";

interface UnifiedPokemonCardProps {
  pokemon: any;
  rank?: number;
  showRank?: boolean;
  showScore?: boolean;
  isRanked?: boolean;
  hideScore?: boolean; // New prop to hide score
}

export const UnifiedPokemonCard: React.FC<UnifiedPokemonCardProps> = ({
  pokemon,
  rank,
  showRank = false,
  showScore = false,
  isRanked = false,
  hideScore = false
}) => {
  // Get background color based on Pokemon type
  const backgroundColor = getPokemonTypeColor(pokemon);
  
  // Format Pokemon ID with leading zeros
  const formattedId = pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0');
  
  return (
    <Card className={`${backgroundColor} relative group hover:shadow-lg transition-shadow border border-gray-200`}>
      {/* Info Button - top right */}
      <div className="absolute top-1 right-1 z-30">
        <PokemonInfoModal pokemon={pokemon} />
      </div>
      
      {/* Rank Badge - top left */}
      {showRank && rank && (
        <div className="absolute top-2 left-2 z-20">
          <Badge 
            variant="secondary" 
            className="bg-white/90 text-gray-800 font-bold text-sm px-2 py-1 shadow-md flex items-center gap-1"
          >
            {rank}
          </Badge>
        </div>
      )}
      
      {/* Crown badge for ranked Pokemon in available section */}
      {isRanked && !showRank && (
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

      <div className="p-4 text-center">
        {/* Pokemon Image */}
        <PokemonCardImage 
          pokemonId={pokemon.id}
          displayName={pokemon.name}
          imageUrl={pokemon.image}
          className="mb-3 mx-auto"
        />
        
        {/* Pokemon Name */}
        <div className="font-semibold text-gray-800 text-sm mb-1 leading-tight">
          {pokemon.name}
        </div>
        
        {/* Pokemon ID */}
        <div className="text-xs text-gray-600 mb-2">
          #{formattedId}
        </div>
        
        {/* Score display - only show if not hidden and showScore is true */}
        {showScore && !hideScore && pokemon.score !== undefined && (
          <div className="text-xs text-gray-700 font-medium">
            Score: {pokemon.score.toFixed(1)}
          </div>
        )}
      </div>
    </Card>
  );
};
