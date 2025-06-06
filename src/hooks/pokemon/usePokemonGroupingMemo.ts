
import { useMemo } from "react";

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
  // Direct memoization without calling another hook inside useMemo
  const groupingResult = useMemo(() => {
    // Inline the Pokemon grouping logic to avoid hook rule violations
    const filteredPokemon = searchTerm.trim() 
      ? pokemon.filter(p => 
          p.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : pokemon;

    if (filteredPokemon.length === 0) {
      return { items: [], showGenerationHeaders: false };
    }

    // Group by generation
    const generationGroups = filteredPokemon.reduce((groups: any, pokemon: any) => {
      const generation = pokemon.generation || 1;
      if (!groups[generation]) {
        groups[generation] = [];
      }
      groups[generation].push(pokemon);
      return groups;
    }, {});

    const sortedGenerations = Object.keys(generationGroups)
      .map(Number)
      .sort((a, b) => a - b);

    const items: any[] = [];
    const showGenerationHeaders = sortedGenerations.length > 1 || searchTerm.trim();

    for (const generation of sortedGenerations) {
      const pokemonInGen = generationGroups[generation];
      
      if (showGenerationHeaders) {
        items.push({
          type: 'generation-header',
          generation: generation,
          count: pokemonInGen.length,
          isExpanded: isGenerationExpanded(generation)
        });
      }

      if (!showGenerationHeaders || isGenerationExpanded(generation)) {
        items.push(...pokemonInGen.map((pokemon: any) => ({
          type: 'pokemon',
          ...pokemon
        })));
      }
    }

    return { items, showGenerationHeaders };
  }, [pokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  return groupingResult;
};
