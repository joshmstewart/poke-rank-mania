
import React from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import { PokemonGridSection } from "@/components/pokemon/PokemonGridSection";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { LoadingState } from "./LoadingState";

interface EnhancedAvailablePokemonContentProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isGenerationExpanded: (generationId: number) => boolean;
  onToggleGeneration: (generationId: number) => void;
  isLoading: boolean;
  loadingRef: React.RefObject<HTMLDivElement>;
  currentPage: number;
  totalPages: number;
}

export const EnhancedAvailablePokemonContent: React.FC<EnhancedAvailablePokemonContentProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isGenerationExpanded,
  onToggleGeneration,
  isLoading,
  loadingRef,
  currentPage,
  totalPages
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <PokemonGridSection
          items={items}
          showGenerationHeaders={showGenerationHeaders}
          viewMode={viewMode}
          isRankingArea={false}
          isGenerationExpanded={isGenerationExpanded}
          onToggleGeneration={onToggleGeneration}
        />
        
        <InfiniteScrollLoader
          loadingRef={loadingRef}
          currentPage={currentPage}
          totalPages={totalPages}
        />
        
        <LoadingState isLoading={isLoading} />
      </div>
    </div>
  );
};
