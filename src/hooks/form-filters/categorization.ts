
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

// FIXED: Enhanced categorization using ID-based mapping for reliability
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const pokemonId = pokemon.id;
  const originalName = pokemon.name;
  let category: PokemonFormType | null = null;
  
  console.log(`🎯 [ID_CATEGORIZATION] Processing "${originalName}" (ID: ${pokemonId})`);
  
  // FIRST: Check ID-based categorization - this is the most reliable
  const idBasedCategory = getHardcodedCategoryByID(pokemonId);
  if (idBasedCategory) {
    category = idBasedCategory;
    console.log(`✅ [ID_BASED_CATEGORY] "${originalName}" (ID: ${pokemonId}) found in ID mapping: ${category}`);
    
    // Track normal Pokemon specifically
    if (category === 'normal') {
      trackedNormalPokemon.add(pokemonId);
      console.log(`📝 [NORMAL_TRACKING] Added Pokemon ${pokemonId} "${originalName}" to normal tracking set. Total: ${trackedNormalPokemon.size}`);
    }
  } else {
    console.log(`⚠️ [NO_ID_MATCH] "${originalName}" (ID: ${pokemonId}) not found in ID mapping, using fallback detection`);
    
    // SECOND: Check if Pokemon should be blocked using pattern detection
    if (isBlockedPokemon(pokemon)) {
      category = 'blocked';
      console.log(`🚫 [BLOCKED_FALLBACK] "${originalName}" (ID: ${pokemonId}) categorized as blocked by pattern detection`);
    } else {
      // THIRD: Use form detection for non-blocked Pokemon
      const name = pokemon.name.toLowerCase();
      category = categorizeFormType(name);
      console.log(`🔍 [PATTERN_FALLBACK] "${originalName}" (ID: ${pokemonId}) categorized as ${category} by pattern detection`);
    }
  }
  
  // Update stats and track ALL examples
  if (category) {
    updateCategoryStats(category, originalName, pokemonId);
  }
  
  console.log(`🏁 [FINAL_CATEGORIZATION] "${originalName}" (ID: ${pokemonId}) final category: ${category}`);
  
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
