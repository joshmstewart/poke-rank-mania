
import React from "react";
import { EnhancedAvailablePokemonContent } from "./EnhancedAvailablePokemonContent";

interface EnhancedAvailablePokemonSectionProps {
  availablePokemon: any[];
  rankedPokemon: any[];
}

const EnhancedAvailablePokemonSection: React.FC<EnhancedAvailablePokemonSectionProps> = ({
  availablePokemon,
  rankedPokemon
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Available Pokémon</h2>
          <div className="text-sm text-gray-500 font-medium">
            {availablePokemon.length} available
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <EnhancedAvailablePokemonContent
          availablePokemon={availablePokemon}
          rankedPokemon={rankedPokemon}
        />
      </div>
    </div>
  );
};

export default EnhancedAvailablePokemonSection;
