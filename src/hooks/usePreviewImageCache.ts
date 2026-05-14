
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CachedPreviewImage {
  id: string;
  cache_key: string;
  image_url: string;
  image_data: Uint8Array | null;
  content_type: string;
  cached_at: string;
  expires_at: string;
}

const PIKACHU_TCG_URL = 'https://images.pokemontcg.io/base1/58.png';
const PIKACHU_POKEMON_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';

export const usePreviewImageCache = () => {
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imageStates, setImageStates] = useState<Record<string, { loaded: boolean; error: boolean }>>({});

  const getCacheKey = (mode: 'tcg' | 'pokemon') => `preview_${mode}_pikachu`;

  const getCachedImage = async (mode: 'tcg' | 'pokemon'): Promise<string | null> => {
    try {
      const cacheKey = getCacheKey(mode);
      
      // Check memory cache first
      if (cachedImages[cacheKey]) {
        console.log(`🖼️ [CLOUD_CACHE] Using memory cached ${mode} image`);
        return cachedImages[cacheKey];
      }

      // Check cloud cache
      const { data, error } = await supabase
        .from('preview_image_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No cached image found
          console.log(`🖼️ [CLOUD_CACHE] No cached ${mode} image found`);
          return null;
        }
        console.error('Error getting cached image:', error);
        return null;
      }

      if (data && data.image_url) {
        console.log(`🖼️ [CLOUD_CACHE] Found cached ${mode} image in cloud`);
        // Store in memory cache for faster access
        setCachedImages(prev => ({ ...prev, [cacheKey]: data.image_url }));
        return data.image_url;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  };

  const cacheImage = async (mode: 'tcg' | 'pokemon', imageUrl: string) => {
    const cacheKey = getCacheKey(mode);
    try {
      // Writes go through the edge function (RLS only allows service role).
      const { error } = await supabase.functions.invoke('cache-tcg-image', {
        body: { imageUrl, cacheKey, metadataOnly: true },
      });
      if (error && import.meta.env.DEV) console.warn('cacheImage failed', error);
      setCachedImages(prev => ({ ...prev, [cacheKey]: imageUrl }));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('cacheImage threw', err);
    }
  };

  const getPreviewImage = async (mode: 'tcg' | 'pokemon'): Promise<string> => {
    setIsLoading(true);
    
    try {
      // Try to get from cache first
      const cachedUrl = await getCachedImage(mode);
      if (cachedUrl) {
        setIsLoading(false);
        return cachedUrl;
      }

      // If not cached, use the appropriate URL and cache it
      const imageUrl = mode === 'tcg' ? PIKACHU_TCG_URL : PIKACHU_POKEMON_URL;
      
      // Cache the image immediately without validation
      await cacheImage(mode, imageUrl);
      setIsLoading(false);
      return imageUrl;
    } catch (error) {
      console.error('Error getting preview image:', error);
      setIsLoading(false);
      return mode === 'tcg' ? PIKACHU_TCG_URL : PIKACHU_POKEMON_URL;
    }
  };

  const updateImageState = (url: string, loaded: boolean, error: boolean) => {
    setImageStates(prev => ({
      ...prev,
      [url]: { loaded, error }
    }));
  };

  // Clean up expired cache entries on component mount
  useEffect(() => {
    const cleanupExpiredCache = async () => {
      try {
        await supabase.rpc('cleanup_expired_preview_cache');
      } catch (error) {
        console.error('Error cleaning up expired cache:', error);
      }
    };

    cleanupExpiredCache();
  }, []);

  return {
    getPreviewImage,
    isLoading,
    cachedImages,
    imageStates,
    updateImageState
  };
};
