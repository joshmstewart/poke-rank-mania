
import { Pokemon } from "@/services/pokemon";
import { PokemonFormType } from "./types";
import { isBlockedPokemon } from "./blockedDetection";
import { categorizeFormType } from "./formDetection";
import { 
  resetCategoryStats, 
  getCategoryStats, 
  getMiscategorizedExamples, 
  logCategoryStats, 
  updateCategoryStats 
} from "./stats";

// Re-export functions for backward compatibility
export { 
  isStarterPokemon, 
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

// FIXED: Much more precise categorization that only catches actual form variants
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const name = pokemon.name.toLowerCase();
  const originalName = pokemon.name; // Keep original for logging
  let category: PokemonFormType | null = null;
  
  // FIRST: Check if Pokemon should be blocked - this takes priority
  if (isBlockedPokemon(pokemon)) {
    category = 'blocked';
    console.log(`🚫 [BLOCKED_CATEGORIZATION] "${originalName}" (ID: ${pokemon.id}) categorized as blocked`);
  } else {
    // Use form detection for non-blocked Pokemon
    category = categorizeFormType(name);
  }
  
  // Update stats and track ALL examples
  if (category) {
    updateCategoryStats(category, originalName, pokemon.id);
  }
  
  return category;
};
