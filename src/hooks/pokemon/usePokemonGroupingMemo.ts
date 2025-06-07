
import { useMemo } from "react";
import { usePokemonGrouping } from "./usePokemonGrouping";

interface UsePokemonGroupingMemoProps {
  pokemon: any[];
  searchTerm: string;
  isRankingArea: boolean;
  isGenerationExpanded: (genId: number) => boolean;
}

export const usePokemonGroupingMemo = ({
  pokemon,
  searchTerm,
  isRankingArea,
  isGenerationExpanded
}: UsePokemonGroupingMemoProps) => {
  // Create a stable key for memoization based on inputs
  const memoKey = useMemo(() => {
    const pokemonIds = pokemon.map(p => p.id).join(',');
    const expandedGens = Array.from({ length: 10 }, (_, i) => i + 1)
      .filter(gen => isGenerationExpanded(gen))
      .join(',');
    
    return `${pokemonIds}-${searchTerm}-${isRankingArea}-${expandedGens}`;
  }, [pokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  // Memoize the grouping result
  const groupingResult = useMemo(() => {
    return usePokemonGrouping(pokemon, searchTerm, isRankingArea, isGenerationExpanded);
  }, [memoKey, pokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  return groupingResult;
};
