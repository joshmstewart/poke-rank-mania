
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTCGImageCache = (imageUrl: string, cacheKey: string) => {
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl || !cacheKey) return;

    const getCachedImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cloud cache first
        const { data, error: fetchError } = await supabase
          .from('preview_image_cache')
          .select('*')
          .eq('cache_key', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error getting cached TCG image:', fetchError);
          setCachedImageUrl(imageUrl); // Fallback to original URL
          setIsLoading(false);
          return;
        }

        if (data && data.image_url) {
          console.log(`🖼️ [TCG_CACHE] Found cached image for ${cacheKey}`);
          setCachedImageUrl(data.image_url);
        } else {
          console.log(`🖼️ [TCG_CACHE] No cached image found for ${cacheKey}, caching original URL`);
          // Cache the original URL
          await supabase
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
          
          setCachedImageUrl(imageUrl);
        }
      } catch (err) {
        console.error('Error in TCG image cache:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCachedImageUrl(imageUrl); // Fallback to original URL
      } finally {
        setIsLoading(false);
      }
    };

    getCachedImage();
  }, [imageUrl, cacheKey]);

  return {
    cachedImageUrl,
    isLoading,
    error
  };
};
