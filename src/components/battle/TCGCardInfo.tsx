
import React from "react";
import { Pokemon } from "@/services/pokemon";

interface TCGCardInfoProps {
  pokemon: Pokemon;
  displayName: string;
}

const TCGCardInfo: React.FC<TCGCardInfoProps> = ({ pokemon, displayName }) => {
  return (
    <div className="space-y-1">
      <h3 className="font-bold text-lg text-gray-800">{displayName}</h3>
      <p className="text-sm text-gray-600">#{pokemon.id}</p>
      
      {/* Always show type tags for consistency */}
      {pokemon.types && pokemon.types.length > 0 && (
        <div className="flex justify-center gap-1 mt-2">
          {pokemon.types.map((type, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TCGCardInfo;
