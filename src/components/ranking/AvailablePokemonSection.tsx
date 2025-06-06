import React, { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/pokemon/types";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
import { useGenerationExpansion } from "@/hooks/pokemon/useGenerationExpansion";
import { useAvailablePokemonGenerations } from "@/hooks/pokemon/useAvailablePokemonGenerations";
import { useSearchMatches } from "@/hooks/pokemon/useSearchMatches";
import { AvailablePokemonHeader } from "./AvailablePokemonHeader";
import { AvailablePokemonControls } from "./AvailablePokemonControls";
import { AvailablePokemonContent } from "./AvailablePokemonContent";

interface AvailablePokemonSectionProps {
  availablePokemon: Pokemon[];
  isLoading: boolean;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
}

export const AvailablePokemonSection: React.FC<AvailablePokemonSectionProps> = ({
  availablePokemon,
  isLoading,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadingRef,
  handlePageChange,
  getPageRange
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  console.log(`🔍 [AVAILABLE_SECTION] Rendering ${availablePokemon.length} available Pokemon for generation ${selectedGeneration}`);

  const availableGenerations = useAvailablePokemonGenerations(availablePokemon);

  const { expandedGenerations, toggleGeneration, isGenerationExpanded, expandAll, collapseAll, expandGenerations } = useGenerationExpansion();

  const generationsWithMatches = useSearchMatches(availablePokemon, searchTerm);

  useEffect(() => {
    if (searchTerm.trim() && generationsWithMatches.length > 0) {
      console.log(`🔍 [SEARCH_EXPAND] Auto-expanding generations with matches: ${generationsWithMatches.join(', ')}`);
      expandGenerations(generationsWithMatches);
    }
  }, [searchTerm, generationsWithMatches, expandGenerations]);

  const isGenerationExpandedForDisplay = (genId: number) => {
    if (searchTerm.trim() && generationsWithMatches.includes(genId)) {
      return true;
    }
    return isGenerationExpanded(genId);
  };

  const { items, showGenerationHeaders } = usePokemonGrouping(
    availablePokemon,
    searchTerm,
    false,
    isGenerationExpandedForDisplay
  );

  console.log(`🔍 [AVAILABLE_SECTION] Pokemon grouping returned ${items.length} items with headers: ${showGenerationHeaders}`);
  console.log(`🔍 [AVAILABLE_SECTION] Available generations: ${availableGenerations.join(', ')}`);

  const allExpanded = expandedGenerations.size === availableGenerations.length && availableGenerations.length > 0;

  return (
    <div className="flex flex-col h-full">
      <AvailablePokemonHeader availablePokemonCount={availablePokemon.length} />
      
      <AvailablePokemonControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allExpanded={allExpanded}
        onExpandAll={() => expandAll(availableGenerations)}
        onCollapseAll={collapseAll}
      />

      <AvailablePokemonContent
        items={items}
        showGenerationHeaders={showGenerationHeaders}
        viewMode={viewMode}
        isGenerationExpanded={isGenerationExpandedForDisplay}
        onToggleGeneration={toggleGeneration}
        isLoading={isLoading}
        loadingRef={loadingRef}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
};
