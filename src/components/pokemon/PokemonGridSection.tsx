
import React from "react";
import { PokemonListContent } from "./PokemonListContent";

interface PokemonGridSectionProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded?: (generationId: number) => boolean;
  onToggleGeneration?: (generationId: number) => void;
  useLazyLoading?: boolean;
}

export const PokemonGridSection: React.FC<PokemonGridSectionProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isRankingArea,
  isGenerationExpanded,
  onToggleGeneration,
  useLazyLoading = false
}) => {
  return (
    <PokemonListContent
      items={items}
      showGenerationHeaders={showGenerationHeaders}
      viewMode={viewMode}
      isRankingArea={isRankingArea}
      isGenerationExpanded={isGenerationExpanded}
      onToggleGeneration={onToggleGeneration}
      useLazyLoading={useLazyLoading}
    />
  );
};
