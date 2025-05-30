
import React from "react";

interface TCGCardInteractionsProps {
  isHovered: boolean;
  isSelected: boolean;
  isProcessing: boolean;
  showFallback?: boolean;
  isLoading?: boolean;
}

const TCGCardInteractions: React.FC<TCGCardInteractionsProps> = ({
  isHovered,
  isSelected,
  isProcessing,
  showFallback = false,
  isLoading = false
}) => {
  return (
    <>
      {/* Selection feedback overlay - REMOVED */}
      {/* The blue hover overlay with "Choose this Pokémon" text has been completely removed */}

      {isSelected && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
          Winner!
        </div>
      )}
    </>
  );
};

export default TCGCardInteractions;
