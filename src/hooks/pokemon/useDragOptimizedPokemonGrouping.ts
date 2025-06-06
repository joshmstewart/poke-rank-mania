
import { useMemo } from "react";
import { usePokemonGrouping } from "./usePokemonGrouping";
import { useDragAwareMemo } from "./useDragAwareMemo";

interface UseDragOptimizedPokemonGroupingProps {
  pokemon: any[];
  searchTerm: string;
  isRankingArea: boolean;
  isGenerationExpanded: (genId: number) => boolean;
  isDragging?: boolean;
}

export const useDragOptimizedPokemonGrouping = ({
  pokemon,
  searchTerm,
  isRankingArea,
  isGenerationExpanded,
  isDragging = false
}: UseDragOptimizedPokemonGroupingProps) => {
  // Create a stable key for memoization based on inputs
  const memoKey = useMemo(() => {
    const pokemonIds = pokemon.map(p => p.id).join(',');
    const expandedGens = Array.from({ length: 10 }, (_, i) => i + 1)
      .filter(gen => isGenerationExpanded(gen))
      .join(',');
    
    return `${pokemonIds}-${searchTerm}-${isRankingArea}-${expandedGens}`;
  }, [pokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  // Use drag-aware memoization for the input parameters
  const stablePokemon = useDragAwareMemo({
    value: pokemon,
    isDragging,
    deps: [memoKey]
  });

  const stableSearchTerm = useDragAwareMemo({
    value: searchTerm,
    isDragging,
    deps: [searchTerm]
  });

  const stableIsRankingArea = useDragAwareMemo({
    value: isRankingArea,
    isDragging,
    deps: [isRankingArea]
  });

  const stableIsGenerationExpanded = useDragAwareMemo({
    value: isGenerationExpanded,
    isDragging,
    deps: [memoKey] // Use memoKey since function depends on expanded state
  });

  // Call the hook directly with stable inputs - this is safe because hooks are called consistently
  const groupingResult = usePokemonGrouping(
    stablePokemon,
    stableSearchTerm,
    stableIsRankingArea,
    stableIsGenerationExpanded
  );

  return groupingResult;
};
