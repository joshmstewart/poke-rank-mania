
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
  // CRITICAL DIAGNOSTIC: This component should NOT be used for the enhanced ranking
  console.log(`🚨🚨🚨 [LEGACY_AVAILABLE_CONTENT] ===== LEGACY AvailablePokemonContent.tsx BEING USED! =====`);
  console.log(`🚨🚨🚨 [LEGACY_AVAILABLE_CONTENT] This is the WRONG component for enhanced ranking!`);
  console.log(`🚨🚨🚨 [LEGACY_AVAILABLE_CONTENT] Should use EnhancedAvailablePokemonContent instead`);
  console.log(`🚨🚨🚨 [LEGACY_AVAILABLE_CONTENT] Items received:`, items.length);

  return (
    <div className="flex-1 overflow-y-auto p-4">
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
    </div>
  );
};
