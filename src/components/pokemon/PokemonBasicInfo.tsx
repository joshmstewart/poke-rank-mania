
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { getGenerationName } from "@/utils/pokemon/pokemonGenerationUtils";

interface PokemonBasicInfoProps {
  pokemon: Pokemon;
}

const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-red-500", Water: "bg-blue-500", Electric: "bg-yellow-400",
  Grass: "bg-green-500", Ice: "bg-blue-200", Fighting: "bg-red-700", Poison: "bg-purple-600",
  Ground: "bg-yellow-700", Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-stone-500", Ghost: "bg-purple-700", Dragon: "bg-indigo-600", Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

const PokemonBasicInfo: React.FC<PokemonBasicInfoProps> = ({ pokemon }) => {
  const normalizedId = normalizePokedexNumber(pokemon.id);
  const generationName = getGenerationName(pokemon.id);

  return (
    <div className="space-y-4">
      {/* Pokemon image with border like the game */}
      <div className="bg-gray-100 border-4 border-gray-400 rounded p-4 text-center">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-32 h-32 mx-auto object-contain"
        />
      </div>
      
      {/* Basic info section */}
      <div className="bg-gray-200 border-2 border-gray-400 rounded p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold">No.</span>
          <span className="font-mono">#{normalizedId}</span>
        </div>
        
        {pokemon.types && pokemon.types.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-bold">Type:</span>
            <div className="flex gap-1">
              {pokemon.types.map(type => (
                <Badge key={type} className={`${typeColors[type]} text-white text-xs px-2 py-0.5`}>
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pokemon.height && (
          <div className="flex justify-between items-center">
            <span className="font-bold">Height:</span>
            <span>{(pokemon.height / 10).toFixed(1)} m</span>
          </div>
        )}

        {pokemon.weight && (
          <div className="flex justify-between items-center">
            <span className="font-bold">Weight:</span>
            <span>{(pokemon.weight / 10).toFixed(1)} kg</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="font-bold">Generation:</span>
          <span>{generationName}</span>
        </div>
      </div>
    </div>
  );
};

export default PokemonBasicInfo;
