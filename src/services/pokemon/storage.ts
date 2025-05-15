
import { Pokemon } from "./types";

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
  localStorage.setItem(storageKey, JSON.stringify(rankings));
  
  // Also update the unified session data
  updateUnifiedSessionData(rankings, generation, type);
}

/**
 * Load rankings from local storage
 */
export function loadRankings(
  generation: number =.0,
  type: "manual" | "battle" = "manual"
): Pokemon[] {
  const storageKey = getStorageKey(generation, type);
  const storedData = localStorage.getItem(storageKey);
  
  if (storedData) {
    try {
      return JSON.parse(storedData);
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
export function loadUnifiedSessionData() {
  const storageKey = 'pokemon-ranker-session';
  let data = {
    generationFilter: 0,
    rankings: {} as Record<string, Pokemon[]>,
    battleHistory: [] as any[]
  };
  
  try {
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      data = JSON.parse(storedData);
    }
  } catch (e) {
    console.error("Error loading session data:", e);
  }
  
  return data;
}

// Save session data for Pokemon Ranker app
export function saveUnifiedSessionData(data: any): void {
  const storageKey = 'pokemon-ranker-session';
  localStorage.setItem(storageKey, JSON.stringify(data));
}

// Update the unified session data with new rankings
function updateUnifiedSessionData(
  rankings: Pokemon[], 
  generation: number, 
  type: "manual" | "battle"
): void {
  const sessionData = loadUnifiedSessionData();
  
  if (!sessionData.rankings) {
    sessionData.rankings = {};
  }
  
  const rankingKey = `${type}-gen-${generation}`;
  sessionData.rankings[rankingKey] = rankings;
  
  saveUnifiedSessionData(sessionData);
}
