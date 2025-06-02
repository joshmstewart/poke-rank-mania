
import React from "react";

interface AvailablePokemonHeaderProps {
  availablePokemonCount: number;
  unrankedCount?: number;
}

export const AvailablePokemonHeader: React.FC<AvailablePokemonHeaderProps> = ({
  availablePokemonCount,
  unrankedCount
}) => {
  const displayCount = unrankedCount !== undefined ? unrankedCount : availablePokemonCount;
  const label = unrankedCount !== undefined ? "Pokémon remaining" : "Pokémon available";

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Filtered Pokémon</h2>
        <div className="text-sm text-gray-500 font-medium">
          {displayCount} {label}
        </div>
      </div>
    </div>
  );
};
