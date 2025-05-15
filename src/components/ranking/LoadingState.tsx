
import React from "react";

interface LoadingStateProps {
  selectedGeneration: number;
  loadSize: number;
  itemsPerPage: number;
  loadingType: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  selectedGeneration, 
  loadSize, 
  itemsPerPage,
  loadingType 
}) => {
  return (
    <div className="flex justify-center items-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading Pokémon...</p>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedGeneration === 0 
            ? `Loading ${loadingType === "single" ? loadSize : itemsPerPage} Pokémon...` 
            : `Loading Generation ${selectedGeneration}...`
          }
        </p>
      </div>
    </div>
  );
};
