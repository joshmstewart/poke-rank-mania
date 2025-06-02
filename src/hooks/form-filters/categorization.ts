
import { Pokemon } from "@/services/pokemon";
import { PokemonFormType } from "./types";
import { isBlockedPokemon } from "./blockedDetection";
import { categorizeFormType } from "./formDetection";
import { getHardcodedCategoryByID } from "./categories/idBasedCategories";
import { 
  resetCategoryStats, 
  getCategoryStats, 
  getMiscategorizedExamples, 
  logCategoryStats, 
  updateCategoryStats 
} from "./stats";

export { 
  isStarterVariant, 
  isTotemPokemon, 
  isSizeVariantPokemon, 
  isSpecialKoraidonMiraidonMode,
  isBlockedPokemon 
} from "./blockedDetection";

export { 
  resetCategoryStats, 
  getCategoryStats, 
  getMiscategorizedExamples, 
  logCategoryStats 
} from "./stats";

let trackedNormalPokemon = new Set<number>();
let filteredOutNormalPokemon = new Set<number>();
let staticListBlockedCount = 0;
let staticListFoundIds: number[] = [];

export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  try {
    const pokemonId = pokemon.id;
    const originalName = pokemon.name;
    let category: PokemonFormType | null = null;
    
    const idBasedCategory = getHardcodedCategoryByID(pokemonId);
    
    if (idBasedCategory) {
      category = idBasedCategory;
      
      if (category === 'blocked') {
        staticListBlockedCount++;
        staticListFoundIds.push(pokemonId);
      }
      
      if (category === 'normal') {
        trackedNormalPokemon.add(pokemonId);
      }
    } else {
      if (isBlockedPokemon(pokemon)) {
        category = 'blocked';
      } else {
        const name = pokemon.name.toLowerCase();
        category = categorizeFormType(name);
      }
    }
    
    if (category) {
      updateCategoryStats(category, originalName, pokemonId);
    }
    
    return category;
  } catch (error) {
    console.error(`Failed to categorize Pokemon ${pokemon.id} "${pokemon.name}":`, error);
    return null;
  }
};

export const getStaticListBlockedCount = () => {
  return {
    count: staticListBlockedCount,
    ids: staticListFoundIds
  };
};

export const trackFilteredPokemon = (pokemon: Pokemon, wasFiltered: boolean, reason?: string) => {
  if (trackedNormalPokemon.has(pokemon.id) && wasFiltered) {
    filteredOutNormalPokemon.add(pokemon.id);
  }
};

export const getNormalPokemonStats = () => {
  return {
    tracked: trackedNormalPokemon.size,
    filteredOut: filteredOutNormalPokemon.size,
    remaining: trackedNormalPokemon.size - filteredOutNormalPokemon.size,
    filteredOutIds: Array.from(filteredOutNormalPokemon),
    trackedIds: Array.from(trackedNormalPokemon)
  };
};

export const resetNormalPokemonTracking = () => {
  trackedNormalPokemon.clear();
  filteredOutNormalPokemon.clear();
  staticListBlockedCount = 0;
  staticListFoundIds = [];
};
