
import React from "react";

interface AvailablePokemonHeaderProps {
  availablePokemonCount: number;
}

export const AvailablePokemonHeader: React.FC<AvailablePokemonHeaderProps> = ({
  availablePokemonCount
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Available Pokémon</h2>
        <div className="text-sm text-gray-500 font-medium">
          {availablePokemonCount} Pokémon available
        </div>
      </div>
    </div>
  );
};
