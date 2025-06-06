
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/pokemon/types";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PokemonGridSection } from "@/components/pokemon/PokemonGridSection";

interface AvailablePokemonContentProps {
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

export const AvailablePokemonContent: React.FC<AvailablePokemonContentProps> = ({
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
    <div className="flex-1 overflow-y-auto p-4">
      <PokemonGridSection
        items={items}
        showGenerationHeaders={showGenerationHeaders}
        viewMode={viewMode}
        isRankingArea={false}
        isGenerationExpanded={isGenerationExpanded}
        onToggleGeneration={onToggleGeneration}
        useLazyLoading={items.length > 100}
      />

      <InfiniteScrollLoader
        isLoading={isLoading}
        loadingRef={loadingRef}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
};
