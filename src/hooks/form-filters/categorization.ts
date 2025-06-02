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

// CRITICAL DEBUG: Add static list verification
let staticListBlockedCount = 0;
let staticListFoundIds: number[] = [];

// FIXED: Enhanced categorization using ID-based mapping for reliability
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  try {
    const pokemonId = pokemon.id;
    const originalName = pokemon.name;
    let category: PokemonFormType | null = null;
    
    // CRITICAL DEBUG: Always check the static ID-based categorization first
    const idBasedCategory = getHardcodedCategoryByID(pokemonId);
    
    if (idBasedCategory) {
      category = idBasedCategory;
      
      // CRITICAL: Track blocked Pokemon specifically from static list
      if (category === 'blocked') {
        staticListBlockedCount++;
        staticListFoundIds.push(pokemonId);
        console.log(`🚫 [STATIC_BLOCKED_FOUND] Pokemon ${pokemonId} "${originalName}" marked as BLOCKED in static list! Total static blocked so far: ${staticListBlockedCount}`);
      }
      
      // Track normal Pokemon specifically
      if (category === 'normal') {
        trackedNormalPokemon.add(pokemonId);
      }
    } else {
      // SECOND: Check if Pokemon should be blocked using pattern detection
      if (isBlockedPokemon(pokemon)) {
        category = 'blocked';
        console.log(`🚫 [BLOCKED_FALLBACK] "${originalName}" (ID: ${pokemonId}) categorized as blocked by pattern detection`);
      } else {
        // THIRD: Use form detection for non-blocked Pokemon
        const name = pokemon.name.toLowerCase();
        category = categorizeFormType(name);
      }
    }
    
    // Update stats and track ALL examples
    if (category) {
      updateCategoryStats(category, originalName, pokemonId);
    }
    
    return category;
  } catch (error) {
    console.error(`❌ [CATEGORIZATION_ERROR] Failed to categorize Pokemon ${pokemon.id} "${pokemon.name}":`, error);
    return null;
  }
};

// CRITICAL: Add function to get static list blocked count
export const getStaticListBlockedCount = () => {
  return {
    count: staticListBlockedCount,
    ids: staticListFoundIds
  };
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
  staticListBlockedCount = 0;
  staticListFoundIds = [];
  console.log(`🧹 [NORMAL_TRACKING_RESET] Reset normal Pokemon tracking and static list counters`);
};
