
import React from "react";

interface BattleCardInteractionsProps {
  isHovered: boolean;
  isSelected: boolean;
  isProcessing: boolean;
}

const BattleCardInteractions: React.FC<BattleCardInteractionsProps> = ({
  isHovered,
  isSelected,
  isProcessing
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

export default BattleCardInteractions;
