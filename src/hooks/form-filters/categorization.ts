
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

// Global tracking for missing normal Pokemon
let trackedNormalPokemon = new Set<number>();
let filteredOutNormalPokemon = new Set<number>();

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
    
    // Track normal Pokemon specifically
    if (category === 'normal') {
      trackedNormalPokemon.add(pokemon.id);
      console.log(`📝 [NORMAL_TRACKING] Added Pokemon ${pokemon.id} "${originalName}" to normal tracking set. Total: ${trackedNormalPokemon.size}`);
    }
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

// New function to track filtered Pokemon
export const trackFilteredPokemon = (pokemon: Pokemon, wasFiltered: boolean, reason?: string) => {
  if (trackedNormalPokemon.has(pokemon.id) && wasFiltered) {
    filteredOutNormalPokemon.add(pokemon.id);
    console.log(`❌ [NORMAL_FILTERED_OUT] Pokemon ${pokemon.id} "${pokemon.name}" was marked as normal but filtered out. Reason: ${reason || 'unknown'}`);
    console.log(`❌ [NORMAL_FILTERED_STATS] Total normal Pokemon tracked: ${trackedNormalPokemon.size}, Filtered out: ${filteredOutNormalPokemon.size}`);
  }
};

// Function to get missing normal Pokemon stats
export const getNormalPokemonStats = () => {
  return {
    tracked: trackedNormalPokemon.size,
    filteredOut: filteredOutNormalPokemon.size,
    remaining: trackedNormalPokemon.size - filteredOutNormalPokemon.size,
    filteredOutIds: Array.from(filteredOutNormalPokemon),
    trackedIds: Array.from(trackedNormalPokemon)
  };
};

// Reset tracking
export const resetNormalPokemonTracking = () => {
  trackedNormalPokemon.clear();
  filteredOutNormalPokemon.clear();
  console.log(`🧹 [NORMAL_TRACKING_RESET] Reset normal Pokemon tracking`);
};
