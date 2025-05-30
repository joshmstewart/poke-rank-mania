import { getPreferredImageUrl } from "@/components/settings/imagePreferenceHelpers";

export const validateImageUrl = async (url: string, displayName: string, pokemonId: number) => {
  if (!url || url.trim() === '') {
    console.warn(`⚠️ PokemonCard: Empty URL generated for ${displayName} (#${pokemonId})`);
    return false;
  }

  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.warn(`⚠️ Image URL check: ${url} returned status ${response.status} - likely to fail loading`);
      return false;
    } else {
      console.log(`✅ Image URL check: ${url} exists on server`);
      return true;
    }
  } catch (error) {
    console.warn(`⚠️ Image URL check failed for ${url}: ${(error as Error).message}`);
    return false;
  }
};

export const attemptCacheBustedLoad = (
  url: string,
  displayName: string,
  onSuccess: (cacheBustUrl: string) => void,
  onFailure: () => void,
  isMountedRef: React.MutableRefObject<boolean>
) => {
  const cacheBustUrl = `${url}?_cb=${Date.now()}`;
  console.log(`🔄 Attempting to load with cache busting: ${cacheBustUrl}`);
  
  const tempImg = new Image();
  tempImg.onload = () => {
    if (!isMountedRef.current) return;
    
    console.log(`✅ Cache-busted image loaded successfully: ${cacheBustUrl}`);
    onSuccess(cacheBustUrl);
  };
  tempImg.onerror = () => {
    if (!isMountedRef.current) return;
    
    console.log(`❌ Cache-busted image also failed: ${cacheBustUrl}`);
    onFailure();
  };
  tempImg.src = cacheBustUrl;
};

export const getNextFallbackUrl = (pokemonId: number, retryCount: number, displayName: string, currentImageType: string) => {
  if (retryCount < 3) {
    const nextRetry = retryCount + 1;
    // Fix: Use only pokemonId argument since getPreferredImageUrl expects 1 argument
    const nextUrl = getPreferredImageUrl(pokemonId);
    
    console.log(`❌ Image load failed for ${displayName} (#${pokemonId}) with type "${currentImageType}" - trying fallback #${nextRetry}: ${nextUrl}`);
    
    return { nextRetry, nextUrl };
  }
  
  console.error(`⛔ All image fallbacks failed for ${displayName} (#${pokemonId})`);
  return null;
};
