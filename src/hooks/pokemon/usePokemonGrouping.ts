
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
  
  // CRITICAL FIX: Ensure pokemon is always a valid array
  const safePokemon = Array.isArray(pokemon) ? pokemon : [];
  console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Input Pokemon count: ${safePokemon.length}`);
  
  // CRITICAL: Log sample input Pokemon
  if (safePokemon.length > 0) {
    safePokemon.slice(0, 3).forEach((p, index) => {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Input Pokemon #${index}:`, {
        id: p?.id,
        name: p?.name,
        isValid: p && typeof p.id === 'number' && p.name,
        hasAllProps: p && p.hasOwnProperty('id') && p.hasOwnProperty('name')
      });
    });
  }

  const items = useMemo(() => {
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] ===== GROUPING LOGIC START =====`);
    
    if (!safePokemon || safePokemon.length === 0) {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] No valid Pokemon input - returning empty array`);
      return [];
    }

    // Filter Pokemon based on search term
    let filteredPokemon = safePokemon;
    if (searchTerm && searchTerm.trim()) {
      filteredPokemon = safePokemon.filter(p => {
        if (!p || !p.name) {
          console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] INVALID Pokemon during search filter:`, p);
          return false;
        }
        return p.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] After search filter: ${filteredPokemon.length} Pokemon`);
    }

    // Group by generation
    const generationGroups = new Map<number, Pokemon[]>();
    
    filteredPokemon.forEach((p, index) => {
      if (!p || typeof p.id !== 'number') {
        console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] INVALID Pokemon at index ${index}:`, p);
        return;
      }
      
      const generation = p.generation || 1;
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, []);
      }
      generationGroups.get(generation)!.push(p);
    });

    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Generation groups created: ${generationGroups.size}`);

    // Create items array with headers and Pokemon
    const result: GroupedItem[] = [];
    const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

    sortedGenerations.forEach(generation => {
      const generationPokemon = generationGroups.get(generation) || [];
      
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Processing generation ${generation}: ${generationPokemon.length} Pokemon`);

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
        generationPokemon.forEach((pokemon, pokemonIndex) => {
          if (!pokemon || typeof pokemon.id !== 'number') {
            console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] INVALID Pokemon in generation ${generation} at index ${pokemonIndex}:`, pokemon);
            return;
          }

          const pokemonItem: GroupedItem = {
            type: 'pokemon',
            id: pokemon.id,
            data: pokemon
          };

          // CRITICAL: Verify the item we're adding is valid
          if (!pokemonItem.data || typeof pokemonItem.data.id !== 'number') {
            console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] CREATING INVALID Pokemon item:`, pokemonItem);
          } else {
            result.push(pokemonItem);
          }
        });
      }
    });

    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] ===== FINAL RESULT VALIDATION =====`);
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Total items created: ${result.length}`);
    
    // CRITICAL: Validate every item in the result
    let invalidItemCount = 0;
    result.forEach((item, index) => {
      if (item.type === 'pokemon') {
        if (!item.data || typeof item.data.id !== 'number' || !item.data.name) {
          console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] INVALID Pokemon item at index ${index}:`, item);
          invalidItemCount++;
        }
      }
    });
    
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Invalid items in final result: ${invalidItemCount}`);
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] ===== GROUPING LOGIC COMPLETE =====`);

    return result;
  }, [safePokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  // Show generation headers if we have multiple generations
  const showGenerationHeaders = useMemo(() => {
    if (!safePokemon || safePokemon.length === 0) return false;
    
    const generations = new Set(safePokemon.map(p => p?.generation || 1));
    return generations.size > 1;
  }, [safePokemon]);

  console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Final return - items: ${items.length}, showHeaders: ${showGenerationHeaders}`);

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
