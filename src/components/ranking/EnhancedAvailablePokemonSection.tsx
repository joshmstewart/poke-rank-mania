
import React, { useState, useEffect } from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import { usePokemonGroupingMemo } from "@/hooks/pokemon/usePokemonGroupingMemo";
import { useGenerationExpansion } from "@/hooks/pokemon/useGenerationExpansion";
import { useAvailablePokemonGenerations } from "@/hooks/pokemon/useAvailablePokemonGenerations";
import { useSearchMatches } from "@/hooks/pokemon/useSearchMatches";
import { AvailablePokemonHeader } from "./AvailablePokemonHeader";
import { AvailablePokemonControls } from "./AvailablePokemonControls";
import { EnhancedAvailablePokemonContent } from "./EnhancedAvailablePokemonContent";

interface EnhancedAvailablePokemonSectionProps {
  enhancedAvailablePokemon: any[];
  isLoading: boolean;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
}

export const EnhancedAvailablePokemonSection: React.FC<EnhancedAvailablePokemonSectionProps> = ({
  enhancedAvailablePokemon,
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

  // Calculate unranked Pokemon count
  const unrankedCount = enhancedAvailablePokemon.filter(p => !p.isRanked).length;

  // Get all possible generations from the available Pokemon
  const availableGenerations = useAvailablePokemonGenerations(enhancedAvailablePokemon);

  const { expandedGenerations, toggleGeneration, isGenerationExpanded, expandAll, collapseAll, expandGenerations } = useGenerationExpansion();

  // Get generations that have search matches
  const generationsWithMatches = useSearchMatches(enhancedAvailablePokemon, searchTerm);

  // Auto-expand generations with search matches
  useEffect(() => {
    if (searchTerm.trim() && generationsWithMatches.length > 0) {
      expandGenerations(generationsWithMatches);
    }
  }, [searchTerm, generationsWithMatches, expandGenerations]);

  // Create a modified isGenerationExpanded function that always shows expanded when searching
  const isGenerationExpandedForDisplay = (genId: number) => {
    if (searchTerm.trim() && generationsWithMatches.includes(genId)) {
      return true;
    }
    return isGenerationExpanded(genId);
  };

  // Use memoized Pokemon grouping
  const { items, showGenerationHeaders } = usePokemonGroupingMemo({
    pokemon: enhancedAvailablePokemon,
    searchTerm,
    isRankingArea: false,
    isGenerationExpanded: isGenerationExpandedForDisplay
  });

  // Fix the type error by ensuring boolean comparison
  const allExpanded = Boolean(expandedGenerations.size === availableGenerations.length && availableGenerations.length > 0);

  return (
    <div className="flex flex-col h-full">
      <AvailablePokemonHeader 
        availablePokemonCount={enhancedAvailablePokemon.length}
        unrankedCount={unrankedCount}
      />
      
      <AvailablePokemonControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allExpanded={allExpanded}
        onExpandAll={() => expandAll(availableGenerations)}
        onCollapseAll={collapseAll}
      />

      <EnhancedAvailablePokemonContent
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
