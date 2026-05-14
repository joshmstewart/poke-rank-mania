
import React, { useState, useEffect, useDeferredValue } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDeferredValue(searchInput);
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
    <div className="flex flex-col h-full" style={{ overflow: 'visible', contain: 'none' }}>
      {/* Header */}
      <div className="bg-card border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Available Pokémon</h2>
          <div className="text-sm text-muted-foreground font-medium whitespace-nowrap">
            {availablePokemon.length} available
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search Pokémon by name or #..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-8 h-9"
            aria-label="Search available Pokémon"
          />
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Content - CRITICAL FIX: Remove all overflow containment */}
      <div className="flex-1" style={{ overflow: 'visible', contain: 'none' }}>
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
