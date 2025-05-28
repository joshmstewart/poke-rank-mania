
import { useEffect, useCallback } from "react";
import { validateImageUrl, attemptCacheBustedLoad } from "./imageLoadingUtils";

export const useImageEffects = (
  pokemonId: number,
  displayName: string,
  currentImageUrl: string,
  imageLoaded: boolean,
  imageError: boolean,
  retryCount: number,
  hasInitialLoadRef: React.MutableRefObject<boolean>,
  imageLoadingTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  isMountedRef: React.MutableRefObject<boolean>,
  initializeImage: () => void,
  handleImageError: () => void
) => {
  // Cleanup function for timers and refs
  const cleanupImageLoading = useCallback(() => {
    if (imageLoadingTimerRef.current) {
      clearTimeout(imageLoadingTimerRef.current);
      imageLoadingTimerRef.current = null;
    }
  }, [imageLoadingTimerRef]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupImageLoading();
    };
  }, [cleanupImageLoading, isMountedRef]);

  const updateImage = useCallback(() => {
    cleanupImageLoading();
    
    if (!isMountedRef.current) return;
    
    initializeImage();
    
    // Log only during development or if explicitly debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`🖼️ PokemonCard: Loading image for ${displayName} (#${pokemonId}): ${currentImageUrl}`);
      
      // Verify if the URL actually exists with a HEAD request
      if (currentImageUrl && currentImageUrl.trim() !== '') {
        validateImageUrl(currentImageUrl, displayName, pokemonId)
          .then(isValid => {
            if (!isMountedRef.current) return;
            
            if (!isValid) {
              // Pre-emptively try first fallback if HEAD request fails
              if (!imageLoaded && !imageError && retryCount === 0) {
                handleImageError();
              }
            } else {
              // Set a longer timeout for high-res images
              if (!imageLoaded && !imageError) {
                imageLoadingTimerRef.current = setTimeout(() => {
                  if (!imageLoaded && !imageError) {
                    console.warn(`⏱️ Image load timeout for ${displayName} after successful HEAD check - triggering fallback`);
                    handleImageError();
                  }
                }, 8000);
              }
            }
          });
      } else {
        handleImageError();
      }
    }
  }, [pokemonId, displayName, currentImageUrl, imageLoaded, imageError, retryCount, cleanupImageLoading, handleImageError, initializeImage, imageLoadingTimerRef, isMountedRef]);

  useEffect(() => {
    updateImage();
    const handlePreferenceChange = () => updateImage();
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => {
      window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
      cleanupImageLoading();
    };
  }, [updateImage, cleanupImageLoading]);

  // Add a safety timeout to trigger fallback if image doesn't load in a reasonable time
  useEffect(() => {
    if (hasInitialLoadRef.current && !imageLoaded && !imageError) {
      cleanupImageLoading();
      
      imageLoadingTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        if (!imageLoaded && !imageError && retryCount === 0) {
          console.warn(`⏱️ Image load timeout for ${displayName} - triggering fallback`);
          handleImageError();
        }
      }, 5000);
      
      return () => cleanupImageLoading();
    }
  }, [imageLoaded, imageError, displayName, retryCount, cleanupImageLoading, handleImageError, hasInitialLoadRef, imageLoadingTimerRef, isMountedRef]);

  return { cleanupImageLoading };
};
