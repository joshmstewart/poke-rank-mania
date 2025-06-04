
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
  // CRITICAL FIX: Ensure array is always defined with safe default
  const safeEnhancedAvailablePokemon = enhancedAvailablePokemon || [];
  
  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Rendering ${safeEnhancedAvailablePokemon.length} enhanced available Pokemon`);
  
  const rankedPokemonInAvailable = useMemo(() => 
    safeEnhancedAvailablePokemon.filter(p => 'isRanked' in p && p.isRanked).length, 
    [safeEnhancedAvailablePokemon]
  );
  
  console.log(`🔍 [ENHANCED_AVAILABLE_SECTION] Ranked Pokemon in available: ${rankedPokemonInAvailable}`);

  const { items, showGenerationHeaders } = usePokemonGrouping(
    safeEnhancedAvailablePokemon, 
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
  
  // Fix: Create refs object for useAutoScrollEffects with safe length access
  const autoScrollRefs = useMemo(() => ({
    containerRef: scrollLoadingRef,
    previousCountRef: React.useRef(safeEnhancedAvailablePokemon.length),
    isAtLastCardOnlyRef: React.useRef(false),
    autoAdjustModeRef: React.useRef(false),
    lastScrollTopRef: React.useRef(0)
  }), [scrollLoadingRef, safeEnhancedAvailablePokemon.length]);

  // Fix: Call useAutoScrollEffects with proper refs object
  useAutoScrollEffects(
    autoScrollRefs,
    safeEnhancedAvailablePokemon.length,
    false // isRankingArea = false for available Pokemon section
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

  if (isLoading && safeEnhancedAvailablePokemon.length === 0) {
    return <LoadingState 
      selectedGeneration={selectedGeneration}
      loadSize={50}
      itemsPerPage={50}
      loadingType={loadingType}
    />;
  }

  // Group Pokemon by generation for display with safe array access
  const generationGroups = useMemo(() => {
    const groups = new Map<number, (Pokemon | RankedPokemon)[]>();
    
    if (safeEnhancedAvailablePokemon && Array.isArray(safeEnhancedAvailablePokemon)) {
      safeEnhancedAvailablePokemon.forEach(pokemon => {
        const generation = pokemon.generation || 1;
        if (!groups.has(generation)) {
          groups.set(generation, []);
        }
        groups.get(generation)!.push(pokemon);
      });
    }
    
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([generation, pokemon]) => ({ generation, pokemon }));
  }, [safeEnhancedAvailablePokemon]);

  return (
    <div className="flex flex-col h-full">
      <AvailablePokemonHeader 
        availablePokemonCount={safeEnhancedAvailablePokemon.length}
        unrankedCount={safeEnhancedAvailablePokemon.filter(p => !('isRanked' in p && p.isRanked)).length}
      />
      
      <div 
        ref={scrollLoadingRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {generationGroups.map(({ generation, pokemon: generationPokemon }) => (
          <div key={generation} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2">
              Generation {generation} ({generationPokemon?.length || 0} Pokémon)
            </h3>
            
            {/* CRITICAL FIX: Proper grid layout with consistent spacing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {generationPokemon && Array.isArray(generationPokemon) && generationPokemon.map((pokemon, index) => renderPokemonCard(pokemon, index))}
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
