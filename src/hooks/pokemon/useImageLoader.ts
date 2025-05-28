
import { useCallback } from "react";
import { useImageState } from "./useImageState";
import { useImageEffects } from "./useImageEffects";
import { attemptCacheBustedLoad, getNextFallbackUrl } from "./imageLoadingUtils";

export interface UseImageLoaderProps {
  pokemonId: number;
  displayName: string;
}

export const useImageLoader = ({ pokemonId, displayName }: UseImageLoaderProps) => {
  const {
    imageLoaded,
    imageError,
    retryCount,
    currentImageUrl,
    currentImageType,
    initialUrlRef,
    hasInitialLoadRef,
    imageLoadingTimerRef,
    imgRef,
    isMountedRef,
    setImageLoaded,
    setImageError,
    setRetryCount,
    setCurrentImageUrl,
    initializeImage
  } = useImageState(pokemonId);

  const handleImageLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (imageLoadingTimerRef.current) {
      clearTimeout(imageLoadingTimerRef.current);
      imageLoadingTimerRef.current = null;
    }
    setImageLoaded(true);
    
    if (retryCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${displayName}`);
    }
  }, [retryCount, currentImageType, displayName, imageLoadingTimerRef, isMountedRef, setImageLoaded]);
  
  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (imageLoadingTimerRef.current) {
      clearTimeout(imageLoadingTimerRef.current);
      imageLoadingTimerRef.current = null;
    }
    
    // Get the failing URL
    const failedUrl = currentImageUrl || initialUrlRef.current;
    
    if (retryCount === 0) {
      if (!failedUrl || failedUrl.trim() === '') {
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${displayName} (#${pokemonId}) failed. No URL was available for the preferred style.`);
      } else {
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${displayName} (#${pokemonId}) failed. URL: ${failedUrl}`);
        
        // Try cache-busted version first
        attemptCacheBustedLoad(
          failedUrl,
          displayName,
          (cacheBustUrl) => {
            setCurrentImageUrl(cacheBustUrl);
            setImageLoaded(true);
          },
          () => proceedToNextFallback(),
          isMountedRef
        );
        return;
      }
    }
    
    // Only proceed to fallback if we're not trying a cache-busted URL
    if (retryCount > 0) {
      proceedToNextFallback();
    }
    
    function proceedToNextFallback() {
      const fallbackResult = getNextFallbackUrl(pokemonId, retryCount, displayName, currentImageType);
      
      if (fallbackResult) {
        const { nextRetry, nextUrl } = fallbackResult;
        setRetryCount(nextRetry);
        setCurrentImageUrl(nextUrl);
        
        // Preload the next image to check if it exists
        const img = new Image();
        img.src = nextUrl;
      } else {
        setImageError(true);
      }
    }
  }, [pokemonId, displayName, retryCount, currentImageUrl, currentImageType, imageLoadingTimerRef, isMountedRef, initialUrlRef, setRetryCount, setCurrentImageUrl, setImageError, setImageLoaded]);

  useImageEffects(
    pokemonId,
    displayName,
    currentImageUrl,
    imageLoaded,
    imageError,
    retryCount,
    hasInitialLoadRef,
    imageLoadingTimerRef,
    isMountedRef,
    initializeImage,
    handleImageError
  );

  // Save a reference to the img element
  const saveImgRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
  }, [imgRef]);

  return {
    imageLoaded,
    imageError,
    currentImageUrl,
    handleImageLoad,
    handleImageError,
    saveImgRef
  };
};
