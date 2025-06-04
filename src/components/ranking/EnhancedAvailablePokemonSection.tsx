
import React, { useMemo, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/pokemon/types";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
import { useScrollObserver } from "@/hooks/pokemon/useScrollObserver";
import { useAutoScrollEffects } from "@/hooks/pokemon/autoScroll/useAutoScrollEffects";
import { LoadingState } from "./LoadingState";
import { AvailablePokemonHeader } from "./AvailablePokemonHeader";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";

interface EnhancedAvailablePokemonSectionProps {
  enhancedAvailablePokemon: (Pokemon | RankedPokemon)[];
  isLoading: boolean;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
}

export const EnhancedAvailablePokemonSection: React.FC<EnhancedAvailablePokemonSectionProps> = React.memo(({
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
  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Rendering ${enhancedAvailablePokemon.length} enhanced available Pokemon`);
  
  const rankedPokemonInAvailable = useMemo(() => 
    enhancedAvailablePokemon.filter(p => 'isRanked' in p && p.isRanked).length, 
    [enhancedAvailablePokemon]
  );
  
  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Ranked Pokemon in available: ${rankedPokemonInAvailable}`);

  const { items, showGenerationHeaders } = usePokemonGrouping(
    enhancedAvailablePokemon, 
    "", 
    false, 
    () => true
  );
  
  // Fix: Call useScrollObserver with proper parameters
  const { loadingRef: scrollLoadingRef } = useScrollObserver(
    loadingType,
    isLoading,
    currentPage,
    totalPages,
    () => {} // Empty function since we handle page changes via props
  );
  
  // Fix: Call useAutoScrollEffects with proper parameters - this is where the TS error was occurring
  useAutoScrollEffects(
    isLoading,
    scrollLoadingRef,
    selectedGeneration
  );

  const renderPokemonCard = useCallback((pokemon: Pokemon | RankedPokemon, index: number) => (
    <OptimizedDraggableCard
      key={pokemon.id}
      pokemon={pokemon}
      index={index}
      context="available"
      showRank={false}
    />
  ), []);

  if (isLoading && enhancedAvailablePokemon.length === 0) {
    return <LoadingState 
      selectedGeneration={selectedGeneration}
      loadSize={50}
      itemsPerPage={50}
      loadingType={loadingType}
    />;
  }

  // Group Pokemon by generation for display
  const generationGroups = useMemo(() => {
    const groups = new Map<number, (Pokemon | RankedPokemon)[]>();
    
    enhancedAvailablePokemon.forEach(pokemon => {
      const generation = pokemon.generation || 1;
      if (!groups.has(generation)) {
        groups.set(generation, []);
      }
      groups.get(generation)!.push(pokemon);
    });
    
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([generation, pokemon]) => ({ generation, pokemon }));
  }, [enhancedAvailablePokemon]);

  return (
    <div className="flex flex-col h-full">
      <AvailablePokemonHeader 
        availablePokemonCount={enhancedAvailablePokemon.length}
        unrankedCount={enhancedAvailablePokemon.filter(p => !('isRanked' in p && p.isRanked)).length}
      />
      
      <div 
        ref={scrollLoadingRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {generationGroups.map(({ generation, pokemon: generationPokemon }) => (
          <div key={generation} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2">
              Generation {generation} ({generationPokemon.length} Pokémon)
            </h3>
            
            {/* CRITICAL FIX: Proper grid layout with consistent spacing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {generationPokemon.map((pokemon, index) => renderPokemonCard(pokemon, index))}
            </div>
          </div>
        ))}
        
        {loadingType === 'infinite' && (
          <InfiniteScrollLoader 
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            loadingRef={loadingRef}
          />
        )}
      </div>
      
      {loadingType === 'pagination' && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageRange={getPageRange()}
          onPageChange={handlePageChange}
          itemsPerPage={50}
        />
      )}
    </div>
  );
});

EnhancedAvailablePokemonSection.displayName = 'EnhancedAvailablePokemonSection';
