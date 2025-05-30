
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CachedPreviewImage {
  url: string;
  timestamp: number;
}

const CACHE_EXPIRY_HOURS = 24;
const PIKACHU_TCG_URL = 'https://images.pokemontcg.io/base1/58.png';
const PIKACHU_POKEMON_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';

export const usePreviewImageCache = () => {
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const getCacheKey = (mode: 'tcg' | 'pokemon') => `preview_${mode}_pikachu`;

  const getCachedImage = async (mode: 'tcg' | 'pokemon'): Promise<string | null> => {
    try {
      const cacheKey = getCacheKey(mode);
      
      // Check memory cache first
      if (cachedImages[cacheKey]) {
        return cachedImages[cacheKey];
      }

      // Check localStorage cache
      const cached = localStorage.getItem(`pokemon_preview_${mode}`);
      if (cached) {
        const parsedCache: CachedPreviewImage = JSON.parse(cached);
        const now = Date.now();
        const expiryTime = parsedCache.timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
        
        if (now < expiryTime) {
          setCachedImages(prev => ({ ...prev, [cacheKey]: parsedCache.url }));
          return parsedCache.url;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(`pokemon_preview_${mode}`);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  };

  const cacheImage = async (mode: 'tcg' | 'pokemon', imageUrl: string) => {
    try {
      const cacheKey = getCacheKey(mode);
      const cacheData: CachedPreviewImage = {
        url: imageUrl,
        timestamp: Date.now()
      };

      // Store in localStorage
      localStorage.setItem(`pokemon_preview_${mode}`, JSON.stringify(cacheData));
      
      // Store in memory
      setCachedImages(prev => ({ ...prev, [cacheKey]: imageUrl }));
      
      console.log(`🖼️ [PREVIEW_CACHE] Cached ${mode} preview image`);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  };

  const getPreviewImage = async (mode: 'tcg' | 'pokemon'): Promise<string> => {
    setIsLoading(true);
    
    try {
      // Try to get from cache first
      const cachedUrl = await getCachedImage(mode);
      if (cachedUrl) {
        console.log(`🖼️ [PREVIEW_CACHE] Using cached ${mode} image`);
        setIsLoading(false);
        return cachedUrl;
      }

      // If not cached, use the appropriate URL and cache it
      const imageUrl = mode === 'tcg' ? PIKACHU_TCG_URL : PIKACHU_POKEMON_URL;
      
      // Verify the image loads before caching
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          console.log(`🖼️ [PREVIEW_CACHE] Successfully loaded and caching ${mode} image`);
          cacheImage(mode, imageUrl);
          setIsLoading(false);
          resolve(imageUrl);
        };
        
        img.onerror = () => {
          console.error(`🖼️ [PREVIEW_CACHE] Failed to load ${mode} image, using fallback`);
          setIsLoading(false);
          resolve(imageUrl); // Still return the URL even if it failed to load
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error getting preview image:', error);
      setIsLoading(false);
      return mode === 'tcg' ? PIKACHU_TCG_URL : PIKACHU_POKEMON_URL;
    }
  };

  return {
    getPreviewImage,
    isLoading,
    cachedImages
  };
};
