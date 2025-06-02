import React, { useState, useMemo, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import PokemonListControls from "@/components/pokemon/PokemonListControls";
import { PokemonGridSection } from "@/components/pokemon/PokemonGridSection";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
import { useGenerationExpansion } from "@/hooks/pokemon/useGenerationExpansion";

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

  // Get all possible generations from the available Pokemon - FIXED generation detection
  const availableGenerations = useMemo(() => {
    const generations = new Set<number>();
    availablePokemon.forEach(pokemon => {
      let gen: number;
      let baseId = pokemon.id;
      
      // For high IDs (variants/forms), try to map to base Pokemon generation
      if (pokemon.id > 1025) {
        // Handle specific known variant ranges
        if (pokemon.id >= 10001 && pokemon.id <= 10300) {
          // Many Gen 6-7 forms are in this range
          baseId = pokemon.id - 10000;
        } else {
          // For other high IDs, try to extract the base from the name
          const pokemonName = pokemon.name.toLowerCase();
          
          // Zygarde forms should be Gen 6
          if (pokemonName.includes('zygarde')) {
            gen = 6;
            generations.add(gen);
            return;
          }
          
          // If we can't determine, use the modulo approach as fallback
          const mod1000 = pokemon.id % 1000;
          const mod10000 = pokemon.id % 10000;
          
          if (mod1000 >= 1 && mod1000 <= 1025) {
            baseId = mod1000;
          } else if (mod10000 >= 1 && mod10000 <= 1025) {
            baseId = mod10000;
          } else {
            // Default to latest generation for unknown high IDs
            gen = 9;
            generations.add(gen);
            return;
          }
        }
      }
      
      // Standard generation ranges for base IDs
      if (baseId <= 151) gen = 1;
      else if (baseId <= 251) gen = 2;
      else if (baseId <= 386) gen = 3;
      else if (baseId <= 493) gen = 4;
      else if (baseId <= 649) gen = 5;
      else if (baseId <= 721) gen = 6;
      else if (baseId <= 809) gen = 7;
      else if (baseId <= 905) gen = 8;
      else if (baseId <= 1025) gen = 9;
      else gen = 9; // Default to latest
      
      generations.add(gen);
    });
    return Array.from(generations).sort((a, b) => a - b);
  }, [availablePokemon]);

  const { expandedGenerations, toggleGeneration, isGenerationExpanded, expandAll, collapseAll, expandGenerations } = useGenerationExpansion();

  // Get generations that have search matches
  const generationsWithMatches = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    console.log(`🔍 [SEARCH_DEBUG] Searching for "${searchTerm}" in ${availablePokemon.length} Pokemon`);
    
    const matchingGenerations = new Set<number>();
    const matchingPokemon: string[] = [];
    
    availablePokemon.forEach(pokemon => {
      const pokemonNameLower = pokemon.name.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      
      if (pokemonNameLower.includes(searchTermLower)) {
        matchingPokemon.push(`${pokemon.name} (ID: ${pokemon.id})`);
        
        // Use the same logic as above to determine generation
        let gen: number;
        let baseId = pokemon.id;
        
        if (pokemon.id > 1025) {
          if (pokemon.id >= 10001 && pokemon.id <= 10300) {
            baseId = pokemon.id - 10000;
          } else {
            const pokemonName = pokemon.name.toLowerCase();
            if (pokemonName.includes('zygarde')) {
              gen = 6;
              matchingGenerations.add(gen);
              return;
            }
            
            const mod1000 = pokemon.id % 1000;
            const mod10000 = pokemon.id % 10000;
            
            if (mod1000 >= 1 && mod1000 <= 1025) {
              baseId = mod1000;
            } else if (mod10000 >= 1 && mod10000 <= 1025) {
              baseId = mod10000;
            } else {
              gen = 9;
              matchingGenerations.add(gen);
              return;
            }
          }
        }
        
        if (baseId <= 151) gen = 1;
        else if (baseId <= 251) gen = 2;
        else if (baseId <= 386) gen = 3;
        else if (baseId <= 493) gen = 4;
        else if (baseId <= 649) gen = 5;
        else if (baseId <= 721) gen = 6;
        else if (baseId <= 809) gen = 7;
        else if (baseId <= 905) gen = 8;
        else if (baseId <= 1025) gen = 9;
        else gen = 9;
        
        matchingGenerations.add(gen);
      }
    });
    
    console.log(`🔍 [SEARCH_DEBUG] Found ${matchingPokemon.length} matching Pokemon:`, matchingPokemon);
    console.log(`🔍 [SEARCH_DEBUG] Matching generations:`, Array.from(matchingGenerations));
    
    return Array.from(matchingGenerations);
  }, [availablePokemon, searchTerm]);

  // Auto-expand generations with search matches
  useEffect(() => {
    if (searchTerm.trim() && generationsWithMatches.length > 0) {
      console.log(`🔍 [SEARCH_EXPAND] Auto-expanding generations with matches: ${generationsWithMatches.join(', ')}`);
      expandGenerations(generationsWithMatches);
    }
  }, [searchTerm, generationsWithMatches, expandGenerations]);

  // Create a modified isGenerationExpanded function that always shows expanded when searching
  const isGenerationExpandedForDisplay = (genId: number) => {
    // If we're searching and this generation has matches, always show as expanded
    if (searchTerm.trim() && generationsWithMatches.includes(genId)) {
      return true;
    }
    // Otherwise use the normal expansion state
    return isGenerationExpanded(genId);
  };

  const { items, showGenerationHeaders } = usePokemonGrouping(
    availablePokemon,
    searchTerm,
    false, // This is not the ranking area
    isGenerationExpandedForDisplay // Use our modified function
  );

  console.log(`🔍 [AVAILABLE_SECTION] Pokemon grouping returned ${items.length} items with headers: ${showGenerationHeaders}`);
  console.log(`🔍 [AVAILABLE_SECTION] Available generations: ${availableGenerations.join(', ')}`);

  const allExpanded = expandedGenerations.size === availableGenerations.length && availableGenerations.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Streamlined Header to match Rankings section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Available Pokémon</h2>
          <div className="text-sm text-gray-500 font-medium">
            {availablePokemon.length} Pokémon available
          </div>
        </div>
      </div>
      
      {/* Controls Section */}
      <div className="p-4 border-b border-gray-200">
        <PokemonListControls
          title=""
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showCollapseAll={true}
          allExpanded={allExpanded}
          onExpandAll={() => expandAll(availableGenerations)}
          onCollapseAll={collapseAll}
        />
      </div>

      {/* Pokemon Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <PokemonGridSection
          items={items}
          showGenerationHeaders={showGenerationHeaders}
          viewMode={viewMode}
          isRankingArea={false}
          isGenerationExpanded={isGenerationExpandedForDisplay}
          onToggleGeneration={toggleGeneration}
        />

        <InfiniteScrollLoader
          isLoading={isLoading}
          loadingRef={loadingRef}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};
