
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
  console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] ===== POKEMON GROUPING DEBUG =====`);
  
  // CRITICAL FIX: Immediate validation before any processing
  const safePokemon = useMemo(() => {
    if (!pokemon || !Array.isArray(pokemon)) {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Invalid pokemon input: ${typeof pokemon}`);
      return [];
    }
    
    return pokemon.filter(p => p && typeof p.id === 'number' && p.name);
  }, [pokemon]);
  
  console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Safe Pokemon count: ${safePokemon.length}`);

  const items = useMemo(() => {
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Processing ${safePokemon.length} safe Pokemon`);
    
    if (safePokemon.length === 0) {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] No Pokemon to process`);
      return [];
    }

    // Filter Pokemon based on search term
    let filteredPokemon = safePokemon;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      filteredPokemon = safePokemon.filter(p => 
        p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group by generation
    const generationGroups = new Map<number, Pokemon[]>();
    
    filteredPokemon.forEach((p) => {
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
      if (isGenerationExpanded && isGenerationExpanded(generation)) {
        generationPokemon.forEach((pokemon) => {
          result.push({
            type: 'pokemon',
            id: pokemon.id,
            data: pokemon
          });
        });
      }
    });

    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Final result: ${result.length} items`);
    return result;
  }, [safePokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  // Show generation headers if we have multiple generations
  const showGenerationHeaders = useMemo(() => {
    if (safePokemon.length === 0) return false;
    
    const generations = new Set(safePokemon.map(p => p.generation || 1));
    return generations.size > 1;
  }, [safePokemon]);

  return { 
    items: items || [], 
    showGenerationHeaders 
  };
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
