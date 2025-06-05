
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
  console.log(`🎯 [ENHANCED_AVAILABLE_CONTENT] Rendering ${items.length} items with stable layout`);
  console.log(`🎯 [ENHANCED_AVAILABLE_CONTENT] Explicit verification - items sample:`, items.slice(0, 3));
  
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
          isLoading={isLoading}
          loadingRef={loadingRef}
          currentPage={currentPage}
          totalPages={totalPages}
        />
        
        {isLoading && (
          <LoadingState 
            selectedGeneration={0}
            loadSize={50}
            itemsPerPage={50}
            loadingType="single"
          />
        )}
      </div>
    </div>
  );
};
