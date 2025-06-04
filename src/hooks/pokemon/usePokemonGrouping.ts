
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
  
  // CRITICAL FIX: Multiple layers of safety checks
  const safePokemon = useMemo(() => {
    // First check: null/undefined
    if (!pokemon) {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Pokemon is null/undefined, returning empty array`);
      return [];
    }
    
    // Second check: array type
    if (!Array.isArray(pokemon)) {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Pokemon is not array (${typeof pokemon}), returning empty array`);
      return [];
    }
    
    // Third check: valid array with proper elements
    const validPokemon = pokemon.filter(p => {
      if (!p) return false;
      if (typeof p.id !== 'number') return false;
      if (!p.name) return false;
      return true;
    });
    
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Input: ${pokemon.length}, Valid: ${validPokemon.length}`);
    return validPokemon;
  }, [pokemon]);
  
  console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Safe Pokemon count: ${safePokemon ? safePokemon.length : 'STILL_UNDEFINED'}`);

  const items = useMemo(() => {
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] ===== GROUPING LOGIC START =====`);
    
    // CRITICAL: Final safety check before processing
    if (!safePokemon || !Array.isArray(safePokemon) || safePokemon.length === 0) {
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] No valid Pokemon input - returning empty array`);
      return [];
    }

    // Filter Pokemon based on search term with safety
    let filteredPokemon = safePokemon;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      filteredPokemon = safePokemon.filter(p => {
        if (!p || !p.name || typeof p.name !== 'string') {
          console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] INVALID Pokemon during search filter:`, p);
          return false;
        }
        return p.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] After search filter: ${filteredPokemon.length} Pokemon`);
    }

    // Group by generation with safety
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
      
      const groupArray = generationGroups.get(generation);
      if (groupArray && Array.isArray(groupArray)) {
        groupArray.push(p);
      }
    });

    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Generation groups created: ${generationGroups.size}`);

    // Create items array with headers and Pokemon
    const result: GroupedItem[] = [];
    const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

    sortedGenerations.forEach(generation => {
      const generationPokemon = generationGroups.get(generation);
      
      if (!generationPokemon || !Array.isArray(generationPokemon)) {
        console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Invalid generation group for ${generation}`);
        return;
      }
      
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
      if (isGenerationExpanded && typeof isGenerationExpanded === 'function' && isGenerationExpanded(generation)) {
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
      if (!item) {
        console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] NULL/UNDEFINED item at index ${index}`);
        invalidItemCount++;
      } else if (item.type === 'pokemon') {
        if (!item.data || typeof item.data.id !== 'number' || !item.data.name) {
          console.error(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] INVALID Pokemon item at index ${index}:`, item);
          invalidItemCount++;
        }
      }
    });
    
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Invalid items in final result: ${invalidItemCount}`);
    console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] ===== GROUPING LOGIC COMPLETE =====`);

    return result.filter(item => item && (item.type === 'header' || (item.data && typeof item.data.id === 'number')));
  }, [safePokemon, searchTerm, isRankingArea, isGenerationExpanded]);

  // Show generation headers if we have multiple generations
  const showGenerationHeaders = useMemo(() => {
    if (!safePokemon || !Array.isArray(safePokemon) || safePokemon.length === 0) return false;
    
    const generations = new Set(safePokemon.map(p => p?.generation || 1));
    return generations.size > 1;
  }, [safePokemon]);

  console.log(`🎯🎯🎯 [POKEMON_GROUPING_CRITICAL] Final return - items: ${items ? items.length : 'UNDEFINED'}, showHeaders: ${showGenerationHeaders}`);

  return { items: items || [], showGenerationHeaders };
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
