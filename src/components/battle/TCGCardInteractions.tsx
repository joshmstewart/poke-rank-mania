
import React from "react";

interface TCGCardInteractionsProps {
  isHovered: boolean;
  isSelected: boolean;
  isProcessing: boolean;
}

const TCGCardInteractions: React.FC<TCGCardInteractionsProps> = ({
  isHovered,
  isSelected,
  isProcessing
}) => {
  return (
    <>
      {/* Selection feedback overlay */}
      {isHovered && !isSelected && !isProcessing && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            Choose this Pokémon
          </div>
        </div>
      )}

      {isSelected && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
          Winner!
        </div>
      )}
    </>
  );
};

export default TCGCardInteractions;
