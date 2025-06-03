
import React, { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

interface PokemonMilestoneInfoProps {
  pokemon: Pokemon | RankedPokemon;
  isDragging: boolean;
  context: 'available' | 'ranked';
}

const PokemonMilestoneInfo: React.FC<PokemonMilestoneInfoProps> = ({
  pokemon,
  isDragging,
  context
}) => {
  const formattedId = useMemo(() => 
    pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0'), [pokemon.id]);

  return (
    <div className={`bg-white text-center py-1.5 px-2 mt-auto border-t border-gray-100 ${
      isDragging ? 'bg-blue-50' : ''
    }`}>
      <h3 className="font-bold text-gray-800 text-sm leading-tight mb-0.5">
        {pokemon.name}
      </h3>
      <div className="text-xs text-gray-600 mb-1">
        #{formattedId}
      </div>
      
      {/* Score display - only for ranked context */}
      {context === 'ranked' && 'score' in pokemon && (
        <div className="text-xs text-gray-700 font-medium">
          Score: {pokemon.score.toFixed(5)}
        </div>
      )}
    </div>
  );
};

export default PokemonMilestoneInfo;
