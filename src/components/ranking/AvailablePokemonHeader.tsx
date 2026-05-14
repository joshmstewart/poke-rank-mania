
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
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Filtered Pokémon</h2>
        <div className="text-sm text-muted-foreground font-medium">
          {displayCount} {label}
        </div>
      </div>
    </div>
  );
};
