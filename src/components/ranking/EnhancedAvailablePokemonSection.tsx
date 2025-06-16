
import React, { useState, useEffect } from "react";
import { EnhancedAvailablePokemonContent } from "./EnhancedAvailablePokemonContent";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
import { useGenerationExpansion } from "@/hooks/pokemon/useGenerationExpansion";
import { useAvailablePokemonGenerations } from "@/hooks/pokemon/useAvailablePokemonGenerations";
import { useSearchMatches } from "@/hooks/pokemon/useSearchMatches";

interface EnhancedAvailablePokemonSectionProps {
  availablePokemon: any[];
  rankedPokemon: any[];
}

const EnhancedAvailablePokemonSection: React.FC<EnhancedAvailablePokemonSectionProps> = ({
  availablePokemon,
  rankedPokemon
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const availableGenerations = useAvailablePokemonGenerations(availablePokemon);

  const { expandedGenerations, toggleGeneration, isGenerationExpanded, expandAll, collapseAll, expandGenerations } = useGenerationExpansion();

  const generationsWithMatches = useSearchMatches(availablePokemon, searchTerm);

  useEffect(() => {
    if (searchTerm.trim() && generationsWithMatches.length > 0) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Available Pokémon</h2>
          <div className="text-sm text-gray-500 font-medium">
            {availablePokemon.length} available
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <EnhancedAvailablePokemonContent
          items={items}
          showGenerationHeaders={showGenerationHeaders}
          viewMode={viewMode}
          isGenerationExpanded={isGenerationExpandedForDisplay}
          onToggleGeneration={toggleGeneration}
          isLoading={false}
          loadingRef={React.createRef()}
          currentPage={1}
          totalPages={1}
          allRankedPokemon={rankedPokemon}
        />
      </div>
    </div>
  );
};

export default EnhancedAvailablePokemonSection;
