
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
        // First, check if we have a cached image in storage
        const { data: cacheData, error: fetchError } = await supabase
          .from('preview_image_cache')
          .select('storage_path, stored_in_storage, image_url, expires_at')
          .eq('cache_key', cacheKey)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('🖼️ [TCG_CACHE] Error checking cache:', fetchError);
        }

        // If we have a cached image in storage that hasn't expired
        if (cacheData?.stored_in_storage && cacheData.storage_path) {
          const now = new Date();
          const expiresAt = new Date(cacheData.expires_at);
          
          if (now < expiresAt) {
            console.log(`🖼️ [TCG_CACHE] Found cached image in storage for ${cacheKey}`);
            const { data: urlData } = supabase.storage
              .from('tcg-images')
              .getPublicUrl(cacheData.storage_path);
            
            setCachedImageUrl(urlData.publicUrl);
            setIsLoading(false);
            return;
          } else {
            console.log(`🖼️ [TCG_CACHE] Cached image expired for ${cacheKey}`);
            // Clean up expired cache
            await supabase
              .from('preview_image_cache')
              .delete()
              .eq('cache_key', cacheKey);
          }
        }

        // If no valid cache, trigger caching via edge function
        console.log(`🖼️ [TCG_CACHE] No cached image found for ${cacheKey}, caching now...`);
        
        const { data: functionData, error: functionError } = await supabase.functions
          .invoke('cache-tcg-image', {
            body: { imageUrl, cacheKey }
          });

        if (functionError) {
          console.error('🖼️ [TCG_CACHE] Function error:', functionError);
          // Fallback to original URL
          setCachedImageUrl(imageUrl);
        } else if (functionData?.cachedUrl) {
          console.log(`🖼️ [TCG_CACHE] Successfully cached image for ${cacheKey}`);
          setCachedImageUrl(functionData.cachedUrl);
        } else {
          console.log(`🖼️ [TCG_CACHE] No cached URL returned, using original`);
          setCachedImageUrl(imageUrl);
        }

      } catch (err) {
        console.error('🖼️ [TCG_CACHE] Error in cache process:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to original URL
        setCachedImageUrl(imageUrl);
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
