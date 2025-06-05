
import React, { useState, useEffect } from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
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

  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Rendering ${enhancedAvailablePokemon.length} enhanced available Pokemon`);
  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Ranked Pokemon in available: ${enhancedAvailablePokemon.filter(p => p.isRanked).length}`);

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
      console.log(`🔍 [ENHANCED_SEARCH_EXPAND] Auto-expanding generations with matches: ${generationsWithMatches.join(', ')}`);
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

  const { items, showGenerationHeaders } = usePokemonGrouping(
    enhancedAvailablePokemon,
    searchTerm,
    false, // This is not the ranking area
    isGenerationExpandedForDisplay
  );

  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Pokemon grouping returned ${items.length} items with headers: ${showGenerationHeaders}`);
  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Available generations: ${availableGenerations.join(', ')}`);

  // Transform items to match the expected interface
  const transformedItems = items.map(item => {
    // Check for header type (usePokemonGrouping returns 'header', not 'generation-header')
    if ('type' in item && item.type === 'header') {
      return {
        type: 'generation-header' as const,
        generationId: item.generationId || 1,
        generationName: (item.data?.name) || `Generation ${item.generationId || 1}`
      };
    }
    // For pokemon items, return the actual pokemon data
    if ('type' in item && item.type === 'pokemon' && item.data) {
      return item.data;
    }
    // Fallback for direct pokemon objects
    return item;
  });

  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Transformed ${transformedItems.length} items`);

  const allExpanded = expandedGenerations.size === availableGenerations.length && availableGenerations.length > 0;

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
        items={transformedItems}
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
