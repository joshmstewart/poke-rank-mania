
import React from "react";
import TypeBadge from "./TypeBadge";

interface PokemonInfoProps {
  displayName: string;
  pokemonId: number;
  types?: string[];
}

const PokemonInfo: React.FC<PokemonInfoProps> = ({ 
  displayName, 
  pokemonId, 
  types 
}) => {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-lg text-gray-800">{displayName}</h3>
      <p className="text-sm text-gray-600">#{pokemonId}</p>
      
      {types && types.length > 0 && (
        <div className="flex justify-center gap-1 mt-2">
          {types.map((type, index) => (
            <TypeBadge key={index} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PokemonInfo;
