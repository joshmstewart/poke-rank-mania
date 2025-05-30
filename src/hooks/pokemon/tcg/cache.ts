
import { TCGCard, CachedTCGCard } from './types';

// Cache configuration
const CACHE_KEY_PREFIX = 'tcg-card-';
const CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

// Persistent cache using localStorage
export const getCachedCard = (pokemonName: string): TCGCard | null => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${pokemonName.toLowerCase()}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const parsed: CachedTCGCard = JSON.parse(cachedData);
    const now = Date.now();
    const expiryTime = parsed.timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`🃏 [TCG_CACHE] Found valid cached card for ${pokemonName}:`, parsed.card);
    return parsed.card;
  } catch (error) {
    console.error(`🃏 [TCG_CACHE] Error reading cache for ${pokemonName}:`, error);
    return null;
  }
};

export const setCachedCard = (pokemonName: string, card: TCGCard | null): void => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${pokemonName.toLowerCase()}`;
    const cacheData: CachedTCGCard = {
      card,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`🃏 [TCG_CACHE] Cached card for ${pokemonName}`);
  } catch (error) {
    console.error(`🃏 [TCG_CACHE] Error saving cache for ${pokemonName}:`, error);
  }
};
