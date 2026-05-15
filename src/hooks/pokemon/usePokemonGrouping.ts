
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";

interface GroupedItem {
  type: 'header' | 'pokemon';
  generationId?: number;
  data?: any;
  id?: number;
}

export const usePokemonGrouping = (
  pokemon: Pokemon[],
  searchTerm: string,
  isRankingArea: boolean,
  isGenerationExpanded: (genId: number) => boolean
) => {
  const items = useMemo(() => {
    if (!pokemon || !Array.isArray(pokemon) || pokemon.length === 0) {
      return [];
    }

    // Filter Pokemon based on search term
    let filteredPokemon = pokemon;
    if (searchTerm.trim()) {
      filteredPokemon = pokemon.filter(p => {
        if (!p || !p.name) return false;
        return p.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Group by generation
    const generationGroups = new Map<number, Pokemon[]>();
    
    filteredPokemon.forEach((p) => {
      if (!p || typeof p.id !== 'number') return;
      const generation = p.generation || 1;
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, []);
      }
      generationGroups.get(generation)!.push(p);
    });

    // Create items array with headers and Pokemon
    const result: GroupedItem[] = [];
    const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

    sortedGenerations.forEach(generation => {
      const generationPokemon = generationGroups.get(generation) || [];

      // Add generation header
      result.push({
        type: 'header',
        generationId: generation,
        data: {
          name: `Generation ${generation}`,
          region: getRegionForGeneration(generation),
          games: getGamesForGeneration(generation)
        }
      });

      // Add Pokemon if generation is expanded
      if (isGenerationExpanded(generation)) {
        generationPokemon.forEach((pokemon) => {
          if (!pokemon || typeof pokemon.id !== 'number') return;
          result.push({ type: 'pokemon', id: pokemon.id, data: pokemon });
        });
      }
    });

    return result;
  }, [pokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  // Show generation headers if we have multiple generations
  const showGenerationHeaders = useMemo(() => {
    if (!pokemon || pokemon.length === 0) return false;
    
    const generations = new Set(pokemon.map(p => p?.generation || 1));
    return generations.size > 1;
  }, [pokemon]);

  return { items, showGenerationHeaders };
};

// Helper functions
const getRegionForGeneration = (gen: number): string => {
  const regions: Record<number, string> = {
    1: "Kanto",
    2: "Johto", 
    3: "Hoenn",
    4: "Sinnoh",
    5: "Unova",
    6: "Kalos",
    7: "Alola",
    8: "Galar",
    9: "Paldea"
  };
  return regions[gen] || "Unknown";
};

const getGamesForGeneration = (gen: number): string => {
  const games: Record<number, string> = {
    1: "Red, Blue, Yellow",
    2: "Gold, Silver, Crystal",
    3: "Ruby, Sapphire, Emerald",
    4: "Diamond, Pearl, Platinum",
    5: "Black, White, B2W2",
    6: "X, Y, ORAS",
    7: "Sun, Moon, USUM",
    8: "Sword, Shield",
    9: "Scarlet, Violet"
  };
  return games[gen] || "Unknown";
};
