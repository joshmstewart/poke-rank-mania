
import React from "react";

interface PokemonDescriptionProps {
  flavorText: string;
  isLoadingFlavor: boolean;
}

const PokemonDescription: React.FC<PokemonDescriptionProps> = ({ 
  flavorText, 
  isLoadingFlavor 
}) => {
  return (
    <div className="bg-gray-200 border-2 border-gray-400 rounded p-4">
      <h3 className="font-bold mb-2">Description:</h3>
      {isLoadingFlavor ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{flavorText || "Loading description..."}</p>
      )}
    </div>
  );
};

export default PokemonDescription;
