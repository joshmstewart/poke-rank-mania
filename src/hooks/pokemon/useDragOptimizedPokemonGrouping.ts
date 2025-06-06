
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

  // Use drag-aware memoization for the grouping result
  const groupingInput = useDragAwareMemo({
    value: { pokemon, searchTerm, isRankingArea, isGenerationExpanded },
    isDragging,
    deps: [memoKey]
  });

  // Only recalculate grouping when not dragging or when inputs actually change
  const groupingResult = useMemo(() => {
    return usePokemonGrouping(
      groupingInput.pokemon, 
      groupingInput.searchTerm, 
      groupingInput.isRankingArea, 
      groupingInput.isGenerationExpanded
    );
  }, [groupingInput.pokemon, groupingInput.searchTerm, groupingInput.isRankingArea, groupingInput.isGenerationExpanded]);

  return groupingResult;
};
