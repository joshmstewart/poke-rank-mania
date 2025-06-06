
import React from "react";
import { VirtualPokemonGrid } from "./VirtualPokemonGrid";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import GenerationHeader from "@/components/pokemon/GenerationHeader";
import { Skeleton } from "@/components/ui/skeleton";

interface EnhancedAvailablePokemonContentProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isGenerationExpanded: (genId: number) => boolean;
  onToggleGeneration: (genId: number) => void;
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
  const containerHeight = 600; // Fixed height for virtual scrolling

  if (showGenerationHeaders) {
    // When showing generation headers, render normally (less performance critical)
    return (
      <div className="flex-1 overflow-y-auto p-2">
        {items.map((item, index) => {
          if (item.type === 'header') {
            return (
              <GenerationHeader
                key={`gen-${item.generationId}`}
                generationId={item.generationId}
                name={item.data?.name || `Generation ${item.generationId}`}
                region={item.data?.region || "Unknown"}
                games={item.data?.games || ""}
                viewMode={viewMode}
                isExpanded={isGenerationExpanded(item.generationId)}
                onToggle={() => onToggleGeneration(item.generationId)}
              />
            );
          }

          return (
            <div key={item.id} className={viewMode === 'grid' ? 'inline-block w-1/4 p-1' : 'mb-1'}>
              {/* Render individual Pokemon cards here if needed */}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="grid grid-cols-4 gap-2 w-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </div>
        )}

        <InfiniteScrollLoader
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          loadingRef={loadingRef}
        />
      </div>
    );
  }

  // Use virtual scrolling for large flat lists
  return (
    <div className="flex-1 flex flex-col">
      <VirtualPokemonGrid
        items={items}
        viewMode={viewMode}
        containerHeight={containerHeight}
      />
      
      {isLoading && (
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}

      <InfiniteScrollLoader
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        loadingRef={loadingRef}
      />
    </div>
  );
};
