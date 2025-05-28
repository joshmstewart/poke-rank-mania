
import { useState, useEffect, useCallback, useRef } from "react";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";

export interface UseImageLoaderProps {
  pokemonId: number;
  displayName: string;
}

export const useImageLoader = ({ pokemonId, displayName }: UseImageLoaderProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [currentImageType, setCurrentImageType] = useState<PokemonImageType>(getPreferredImageType());
  
  // Use refs to track image loading state across renders
  const initialUrlRef = useRef<string>("");
  const hasInitialLoadRef = useRef<boolean>(false);
  const imageLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup function for timers and refs
  const cleanupImageLoading = useCallback(() => {
    if (imageLoadingTimerRef.current) {
      clearTimeout(imageLoadingTimerRef.current);
      imageLoadingTimerRef.current = null;
    }
  }, []);

  // Handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupImageLoading();
    };
  }, [cleanupImageLoading]);

  const handleImageLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    
    cleanupImageLoading();
    setImageLoaded(true);
    
    if (retryCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${displayName}`);
    }
  }, [retryCount, currentImageType, displayName, cleanupImageLoading]);
  
  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    cleanupImageLoading();
    
    // Get the failing URL
    const failedUrl = currentImageUrl || initialUrlRef.current;
    
    if (retryCount === 0) {
      if (!failedUrl || failedUrl.trim() === '') {
        // If URL is empty or undefined
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${displayName} (#${pokemonId}) failed. No URL was available for the preferred style.`);
      } else {
        // Log the initial failure with the actual URL
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${displayName} (#${pokemonId}) failed. URL: ${failedUrl}`);
        
        // Additional diagnostic: Check if the URL exists on server with fetch HEAD
        fetch(failedUrl, { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        })
        .then(response => {
          if (!isMountedRef.current) return;
          
          if (!response.ok) {
            console.error(`🔴 Confirmed: URL ${failedUrl} returned ${response.status} from server`);
          } else {
            console.error(`❓ Unexpected: URL ${failedUrl} exists on server but image still failed to load`);
            
            // Attempt to load with a fresh browser cache
            if (retryCount === 0) {
              const cacheBustUrl = `${failedUrl}?_cb=${Date.now()}`;
              console.log(`🔄 Attempting to load with cache busting: ${cacheBustUrl}`);
              
              // Try once more with cache busting before going to fallback
              const tempImg = new Image();
              tempImg.onload = () => {
                if (!isMountedRef.current) return;
                
                console.log(`✅ Cache-busted image loaded successfully: ${cacheBustUrl}`);
                setCurrentImageUrl(cacheBustUrl);
                setImageLoaded(true);
              };
              tempImg.onerror = () => {
                if (!isMountedRef.current) return;
                
                console.log(`❌ Cache-busted image also failed: ${cacheBustUrl}`);
                proceedToNextFallback();
              };
              tempImg.src = cacheBustUrl;
              
              // Don't proceed to fallback yet, wait for cache-busted attempt
              return;
            }
          }
        })
        .catch(error => {
          if (!isMountedRef.current) return;
          console.error(`🔴 Network error checking ${failedUrl}: ${error.message}`);
          proceedToNextFallback();
        });
      }
    }
    
    // Only proceed to fallback if we're not trying a cache-busted URL
    if (retryCount > 0) {
      proceedToNextFallback();
    }
    
    function proceedToNextFallback() {
      if (retryCount < 3) {  // Keep up to 3 retries to handle the new longer fallback chain
        const nextRetry = retryCount + 1;
        const nextUrl = getPreferredImageUrl(pokemonId, nextRetry);
        
        // Enhanced error logging to diagnose why official artwork is failing
        console.log(`❌ Image load failed for ${displayName} (#${pokemonId}) with type "${currentImageType}" - trying fallback #${nextRetry}: ${nextUrl}`);
        
        setRetryCount(nextRetry);
        setCurrentImageUrl(nextUrl);
        
        // Preload the next image to check if it exists
        const img = new Image();
        img.src = nextUrl;
      } else {
        console.error(`⛔ All image fallbacks failed for ${displayName} (#${pokemonId})`);
        setImageError(true);
      }
    }
  }, [pokemonId, displayName, retryCount, currentImageUrl, currentImageType, cleanupImageLoading]);

  const updateImage = useCallback(() => {
    // Clean up any previous loading state
    cleanupImageLoading();
    
    if (!isMountedRef.current) return;
    
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    const preference = getPreferredImageType();
    setCurrentImageType(preference);
    
    // Generate URL first, then set it to make sure we capture it
    const url = getPreferredImageUrl(pokemonId);
    setCurrentImageUrl(url);
    initialUrlRef.current = url; // Store initial URL in ref
    
    // Set initial load flag
    hasInitialLoadRef.current = true;
    
    // Log only during development or if explicitly debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`🖼️ PokemonCard: Loading "${preference}" image for ${displayName} (#${pokemonId}): ${url}`);
      
      // Verify if the URL actually exists with a HEAD request - always do this
      if (url && url.trim() !== '') {
        fetch(url, { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        })
        .then(response => {
          if (!isMountedRef.current) return;
          
          if (!response.ok) {
            console.warn(`⚠️ Image URL check: ${url} returned status ${response.status} - likely to fail loading`);
            // Pre-emptively try first fallback if HEAD request fails
            if (!imageLoaded && !imageError && retryCount === 0) {
              handleImageError();
            }
          } else {
            console.log(`✅ Image URL check: ${url} exists on server`);
            // Even if HEAD request succeeds, sometimes the image still fails to load
            // Set a longer timeout only if the image hasn't loaded yet, giving it more time
            if (!imageLoaded && !imageError) {
              imageLoadingTimerRef.current = setTimeout(() => {
                if (!imageLoaded && !imageError) {
                  console.warn(`⏱️ Image load timeout for ${displayName} after successful HEAD check - triggering fallback`);
                  handleImageError();
                }
              }, 8000); // Increased timeout (8 seconds) for high-res images
            }
          }
        })
        .catch(error => {
          if (!isMountedRef.current) return;
          
          console.warn(`⚠️ Image URL check failed for ${url}: ${error.message}`);
          // Pre-emptively try first fallback if HEAD request fails
          if (!imageLoaded && !imageError && retryCount === 0) {
            handleImageError();
          }
        });
      } else {
        console.warn(`⚠️ PokemonCard: Empty URL generated for ${displayName} (#${pokemonId})`);
        handleImageError();
      }
    }
  }, [pokemonId, displayName, imageLoaded, imageError, retryCount, cleanupImageLoading, handleImageError]);

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
      }, 5000); // 5 second timeout (increased from 2 seconds)
      
      return () => cleanupImageLoading();
    }
  }, [imageLoaded, imageError, displayName, retryCount, cleanupImageLoading, handleImageError]);

  // Save a reference to the img element
  const saveImgRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
  }, []);

  return {
    imageLoaded,
    imageError,
    currentImageUrl,
    handleImageLoad,
    handleImageError,
    saveImgRef
  };
};
