
import React from "react";

interface PokemonRankerDebugControlsProps {
  onManualSync: () => void;
}

export const PokemonRankerDebugControls: React.FC<PokemonRankerDebugControlsProps> = ({
  onManualSync
}) => {
  // This component is hidden as per user request to reduce clutter.
  return null;
};
