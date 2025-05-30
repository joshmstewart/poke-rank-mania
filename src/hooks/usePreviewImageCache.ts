
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
    try {
      const cacheKey = getCacheKey(mode);
      
      // Store in cloud cache
      const { error } = await supabase
        .from('preview_image_cache')
        .upsert([
          {
            cache_key: cacheKey,
            image_url: imageUrl,
            content_type: 'image/png',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }
        ], {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('Error caching image:', error);
        return;
      }

      // Store in memory cache
      setCachedImages(prev => ({ ...prev, [cacheKey]: imageUrl }));
      
      console.log(`🖼️ [CLOUD_CACHE] Cached ${mode} preview image in cloud for 30 days`);
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
