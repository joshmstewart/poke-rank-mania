
import { Pokemon, UnifiedSessionData } from "./types";
import { Rating } from "ts-trueskill";

// Alias for backwards compatibility
export const getSavedRankings = loadRankings;

/**
 * Save rankings to local storage
 */
export function saveRankings(
  rankings: Pokemon[], 
  generation: number = 0,
  type: "manual" | "battle" = "manual"
): void {
  const storageKey = getStorageKey(generation, type);
  
  // Before saving, extract rating data to be stored separately
  const serializableRankings = rankings.map(pokemon => {
    // Extract rating data
    const ratingData = pokemon.rating ? {
      mu: pokemon.rating.mu,
      sigma: pokemon.rating.sigma
    } : undefined;
    
    // Create a copy without the rating object (which can't be serialized)
    const { rating, ...rest } = pokemon;
    return rest;
  });
  
  localStorage.setItem(storageKey, JSON.stringify(serializableRankings));
  
  // Also save rating data separately
  const ratingData: Record<number, { mu: number; sigma: number }> = {};
  rankings.forEach(pokemon => {
    if (pokemon.rating) {
      ratingData[pokemon.id] = {
        mu: pokemon.rating.mu,
        sigma: pokemon.rating.sigma
      };
    }
  });
  
  // Update unified session data with both rankings and rating data
  updateUnifiedSessionData(serializableRankings, generation, type, ratingData);
}

/**
 * Load rankings from local storage
 */
export function loadRankings(
  generation: number = 0,
  type: "manual" | "battle" = "manual"
): Pokemon[] {
  const storageKey = getStorageKey(generation, type);
  const storedData = localStorage.getItem(storageKey);
  
  if (storedData) {
    try {
      // Load the basic Pokemon data
      const pokemonData = JSON.parse(storedData) as Pokemon[];
      
      // Load the session data to get rating information
      const sessionData = loadUnifiedSessionData();
      const ratingData = sessionData.ratingData || {};
      
      // Restore ratings to the Pokemon objects
      return pokemonData.map(pokemon => {
        const storedRating = ratingData[pokemon.id];
        if (storedRating) {
          pokemon.rating = new Rating(storedRating.mu, storedRating.sigma);
        }
        return pokemon;
      });
    } catch (e) {
      console.error("Error parsing stored rankings:", e);
    }
  }
  
  return [];
}

/**
 * Clear rankings from local storage
 */
export function clearRankings(
  generation: number = 0,
  type: "manual" | "battle" = "manual"
): void {
  const storageKey = getStorageKey(generation, type);
  localStorage.removeItem(storageKey);
}

/**
 * Generate storage key based on generation and type
 */
function getStorageKey(
  generation: number,
  type: "manual" | "battle"
): string {
  return `pokemon-rankings-${type}-gen-${generation}`;
}

// Get session data for Pokemon Ranker app
export function loadUnifiedSessionData(): UnifiedSessionData {
  const storageKey = 'pokemon-ranker-session';
  let data: UnifiedSessionData = {
    generationFilter: 0,
    rankings: {} as Record<string, Pokemon[]>,
    battleHistory: [] as any[],
    sessionId: '',
    lastUpdate: Date.now(),
    ratingData: {} // Initialize empty rating data
  };
  
  try {
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      data = JSON.parse(storedData);
      // Ensure ratingData exists
      if (!data.ratingData) {
        data.ratingData = {};
      }
    }
  } catch (e) {
    console.error("Error loading session data:", e);
  }
  
  return data;
}

// Save session data for Pokemon Ranker app
export function saveUnifiedSessionData(data: UnifiedSessionData): void {
  const storageKey = 'pokemon-ranker-session';
  localStorage.setItem(storageKey, JSON.stringify(data));
}

// Update the unified session data with new rankings
function updateUnifiedSessionData(
  rankings: Pokemon[], 
  generation: number, 
  type: "manual" | "battle",
  ratingData?: Record<number, { mu: number; sigma: number }>
): void {
  const sessionData = loadUnifiedSessionData();
  
  if (!sessionData.rankings) {
    sessionData.rankings = {};
  }
  
  const rankingKey = `${type}-gen-${generation}`;
  sessionData.rankings[rankingKey] = rankings;
  
  // Update rating data if provided
  if (ratingData) {
    if (!sessionData.ratingData) {
      sessionData.ratingData = {};
    }
    
    // Merge the new rating data with existing
    sessionData.ratingData = {
      ...sessionData.ratingData,
      ...ratingData
    };
  }
  
  saveUnifiedSessionData(sessionData);
}

/**
 * Export session data for sharing/backup
 */
export function exportUnifiedSessionData(): string {
  const sessionData = loadUnifiedSessionData();
  return JSON.stringify(sessionData);
}

/**
 * Import session data from external source
 */
export function importUnifiedSessionData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData) as UnifiedSessionData;
    // Basic validation to ensure it's a valid session data
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    saveUnifiedSessionData(data);
    return true;
  } catch (e) {
    console.error("Error importing session data:", e);
    return false;
  }
}
