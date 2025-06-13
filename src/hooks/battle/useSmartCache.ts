
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";

interface CacheEntry {
  data: Pokemon[];
  timestamp: number;
  version: string;
  compressed?: boolean;
}

const CACHE_VERSION = "v2.1"; // Increment when data structure changes
const CACHE_EXPIRY_HOURS = 24; // 24 hours cache expiry
const COMPRESSION_THRESHOLD = 100; // Compress if more than 100 Pokemon

export const useSmartCache = () => {
  const getCacheKey = useCallback((type: 'essential' | 'full', genId?: number) => {
    return `pokemon-smart-cache-${type}-${genId || 'all'}-${CACHE_VERSION}`;
  }, []);

  const isValidCache = useCallback((entry: CacheEntry): boolean => {
    const now = Date.now();
    const expiryTime = entry.timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
    const isExpired = now > expiryTime;
    const isVersionValid = entry.version === CACHE_VERSION;
    
    return !isExpired && isVersionValid && entry.data && entry.data.length > 0;
  }, []);

  const compressData = useCallback((data: Pokemon[]): string => {
    // Simple compression - stringify and use basic compression techniques
    const jsonString = JSON.stringify(data);
    try {
      // Use browser's built-in compression if available
      if (typeof CompressionStream !== 'undefined') {
        // For now, just return stringified data
        // In future, could implement actual compression
        return jsonString;
      }
      return jsonString;
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return jsonString;
    }
  }, []);

  const decompressData = useCallback((compressedData: string): Pokemon[] => {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Failed to decompress cache data:', error);
      return [];
    }
  }, []);

  const getCachedData = useCallback((type: 'essential' | 'full', genId?: number): Pokemon[] | null => {
    try {
      const cacheKey = getCacheKey(type, genId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`📋 [SMART_CACHE] No cache found for ${type}`);
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      
      if (!isValidCache(entry)) {
        console.log(`🗑️ [SMART_CACHE] Invalid/expired cache for ${type}, removing`);
        localStorage.removeItem(cacheKey);
        return null;
      }

      const data = entry.compressed ? decompressData(entry.data as unknown as string) : entry.data;
      console.log(`✅ [SMART_CACHE] Valid cache found for ${type}: ${data.length} Pokemon`);
      
      return data;
    } catch (error) {
      console.error(`❌ [SMART_CACHE] Error reading cache for ${type}:`, error);
      return null;
    }
  }, [getCacheKey, isValidCache, decompressData]);

  const setCachedData = useCallback((data: Pokemon[], type: 'essential' | 'full', genId?: number) => {
    try {
      const cacheKey = getCacheKey(type, genId);
      const shouldCompress = data.length > COMPRESSION_THRESHOLD;
      
      const entry: CacheEntry = {
        data: shouldCompress ? compressData(data) as unknown as Pokemon[] : data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        compressed: shouldCompress
      };

      const serialized = JSON.stringify(entry);
      
      // Check if we're approaching localStorage limits
      const currentSize = new Blob([serialized]).size;
      if (currentSize > 4 * 1024 * 1024) { // 4MB threshold
        console.warn(`⚠️ [SMART_CACHE] Large cache size (${Math.round(currentSize / 1024)}KB), consider optimization`);
      }

      localStorage.setItem(cacheKey, serialized);
      console.log(`💾 [SMART_CACHE] Cached ${data.length} Pokemon for ${type} (${shouldCompress ? 'compressed' : 'uncompressed'})`);
      
    } catch (error) {
      console.error(`❌ [SMART_CACHE] Failed to cache data for ${type}:`, error);
      
      // If storage is full, try to clear old caches
      if (error.name === 'QuotaExceededError') {
        clearExpiredCaches();
        // Try again
        try {
          const entry: CacheEntry = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
            compressed: false
          };
          localStorage.setItem(getCacheKey(type, genId), JSON.stringify(entry));
          console.log(`💾 [SMART_CACHE] Cached after cleanup: ${data.length} Pokemon for ${type}`);
        } catch (retryError) {
          console.error(`❌ [SMART_CACHE] Failed to cache even after cleanup:`, retryError);
        }
      }
    }
  }, [getCacheKey, compressData]);

  const clearExpiredCaches = useCallback(() => {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pokemon-')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (!isValidCache(entry)) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ [SMART_CACHE] Removed expired cache: ${key}`);
    });
    
    console.log(`🧹 [SMART_CACHE] Cleaned up ${keysToRemove.length} expired caches`);
  }, [isValidCache]);

  const clearAllCaches = useCallback(() => {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pokemon-')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ [SMART_CACHE] Cleared all Pokemon caches: ${keysToRemove.length} items`);
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearExpiredCaches,
    clearAllCaches
  };
};
