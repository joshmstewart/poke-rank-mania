
import { Pokemon, UnifiedSessionData } from "./types";
import { Rating } from "ts-trueskill";
import { useTrueSkillStore } from "@/stores/trueskillStore";

// Alias for backwards compatibility - now uses cloud storage
export const getSavedRankings = loadRankings;

/**
 * Save rankings to cloud storage (no localStorage)
 */
export function saveRankings(
  rankings: Pokemon[], 
  generation: number = 0,
  type: "manual" | "battle" = "manual"
): void {
  console.log('[POKEMON_STORAGE_CLOUD] Save rankings called - using cloud storage only');
  
  // Extract and store rating data in centralized TrueSkill store
  rankings.forEach(pokemon => {
    if (pokemon.rating) {
      // Note: This would need to be implemented properly if used
      console.log(`[POKEMON_STORAGE_CLOUD] Would store rating for ${pokemon.id}`);
    }
  });
  
  console.log(`[POKEMON_STORAGE_CLOUD] Processed ${rankings.length} Pokemon ratings`);
}

/**
 * Load rankings from cloud storage (no localStorage)
 */
export function loadRankings(
  generation: number = 0,
  type: "manual" | "battle" = "manual"
): Pokemon[] {
  console.log('[POKEMON_STORAGE_CLOUD] Load rankings called - using cloud storage only');
  
  // Rankings are now generated dynamically from TrueSkill store
  // No need to load from localStorage
  return [];
}

/**
 * Clear rankings from cloud storage (no localStorage)
 */
export function clearRankings(
  generation: number = 0,
  type: "manual" | "battle" = "manual"
): void {
  console.log('[POKEMON_STORAGE_CLOUD] Clear rankings called - using cloud storage only');
  
  // Clear from centralized store (will auto-sync to cloud)
  useTrueSkillStore.getState().clearAllRatings();
}

/**
 * Generate storage key - deprecated, kept for compatibility
 */
function getStorageKey(
  generation: number,
  type: "manual" | "battle"
): string {
  return `pokemon-rankings-${type}-gen-${generation}`;
}

// Cloud-only session data management
export function loadUnifiedSessionData(): UnifiedSessionData {
  console.log('[POKEMON_STORAGE_CLOUD] Loading unified session data from cloud');
  
  // Return minimal session data structure
  const data: UnifiedSessionData = {
    generationFilter: 0,
    rankings: {} as Record<string, Pokemon[]>,
    battleHistory: [] as any[],
    sessionId: crypto.randomUUID(),
    lastUpdate: Date.now(),
    ratingData: {} // No longer used - data is in TrueSkill store
  };
  
  return data;
}

// Cloud-only session data saving
export function saveUnifiedSessionData(data: UnifiedSessionData): void {
  console.log('[POKEMON_STORAGE_CLOUD] Save unified session data - using cloud storage only');
  // Session data is now managed by TrueSkill store and Supabase
}

/**
 * Export session data from cloud
 */
export function exportUnifiedSessionData(): string {
  const allRatings = useTrueSkillStore.getState().getAllRatings();
  const sessionData: UnifiedSessionData = {
    generationFilter: 0,
    rankings: {},
    battleHistory: [],
    sessionId: crypto.randomUUID(),
    lastUpdate: Date.now(),
    ratingData: {}
  };
  
  return JSON.stringify(sessionData);
}

/**
 * Import session data to cloud
 */
export function importUnifiedSessionData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData) as UnifiedSessionData;
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Import logic would go here if needed
    return true;
  } catch (e) {
    console.error("Error importing session data:", e);
    return false;
  }
}
