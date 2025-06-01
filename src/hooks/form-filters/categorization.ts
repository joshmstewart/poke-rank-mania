
import { Pokemon } from "@/services/pokemon";
import { PokemonFormType } from "./types";
import { isBlockedPokemon } from "./blockedDetection";
import { categorizeFormType } from "./formDetection";
import { getHardcodedCategory, normalPokemonRange } from "./hardcodedCategories";
import { 
  resetCategoryStats, 
  getCategoryStats, 
  getMiscategorizedExamples, 
  logCategoryStats, 
  updateCategoryStats 
} from "./stats";

// Re-export functions for backward compatibility
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

// FIXED: Enhanced categorization with hardcoded mapping first, pattern detection as fallback
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const name = pokemon.name.toLowerCase();
  const originalName = pokemon.name; // Keep original for logging
  let category: PokemonFormType | null = null;
  
  console.log(`🎯 [CATEGORIZATION_ENHANCED] Processing "${originalName}" (ID: ${pokemon.id})`);
  
  // FIRST: Check hardcoded categorization - this is the most reliable
  const hardcodedCategory = getHardcodedCategory(name);
  if (hardcodedCategory) {
    category = hardcodedCategory;
    console.log(`✅ [HARDCODED_CATEGORY] "${originalName}" (ID: ${pokemon.id}) found in hardcoded list: ${category}`);
  } else {
    console.log(`⚠️ [NO_HARDCODED_MATCH] "${originalName}" (ID: ${pokemon.id}) not found in hardcoded list, using fallback detection`);
    
    // SECOND: Check if Pokemon should be blocked using pattern detection
    if (isBlockedPokemon(pokemon)) {
      category = 'blocked';
      console.log(`🚫 [BLOCKED_FALLBACK] "${originalName}" (ID: ${pokemon.id}) categorized as blocked by pattern detection`);
    } else {
      // THIRD: Use form detection for non-blocked Pokemon
      category = categorizeFormType(name);
      console.log(`🔍 [PATTERN_FALLBACK] "${originalName}" (ID: ${pokemon.id}) categorized as ${category} by pattern detection`);
    }
  }
  
  // Update stats and track ALL examples
  if (category) {
    updateCategoryStats(category, originalName, pokemon.id);
  }
  
  console.log(`🏁 [FINAL_CATEGORIZATION] "${originalName}" (ID: ${pokemon.id}) final category: ${category}`);
  
  return category;
};
