
import React, { memo, useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";
import { formatPokemonName } from "@/utils/pokemonUtils";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { toast } from "sonner";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: "pairs" | "triplets";
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const BattleCard: React.FC<BattleCardProps> = memo(({ pokemon, isSelected, onSelect, isProcessing = false }) => {
  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    const [validated] = validateBattlePokemon([pokemon]);
    return validated;
  }, [pokemon]);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [currentImageType, setCurrentImageType] = useState<PokemonImageType>(getPreferredImageType());
  
  // Use refs to track image loading state across renders
  const initialUrlRef = useRef<string>(""); 
  const hasInitialLoadRef = useRef<boolean>(false);
  const imageLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isMountedRef = useRef(true);
  const successfulCacheBustedUrlRef = useRef<string | null>(null);
  const clickDisabledRef = useRef(false);
  
  const formattedName = formatPokemonName(validatedPokemon.name);
  const pokemonId = validatedPokemon.id; // Ensure we use the consistent ID throughout

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

  const updateImage = useCallback(() => {
    // If we already have a successful cache-busted URL, use it directly
    if (successfulCacheBustedUrlRef.current) {
      console.log(`🔄 BattleCard: Reusing successful cache-busted URL for ${formattedName} (#${pokemonId}): ${successfulCacheBustedUrlRef.current}`);
      setImageLoaded(true);
      setImageError(false);
      setCurrentImageUrl(successfulCacheBustedUrlRef.current);
      return;
    }
    
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
      console.log(`🖼️ BattleCard: Loading "${preference}" image for ${formattedName} (#${pokemonId}): ${url}`);
      
      // Always verify if URL exists on server
      if (url && url.trim() !== '') {
        fetch(url, { 
          method: 'HEAD',
          // Add cache busting to prevent cached 304 responses
          cache: 'no-cache',
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000)
        })
        .then(response => {
          if (!isMountedRef.current) return;
          
          if (!response.ok) {
            console.warn(`⚠️ BattleCard image URL check: ${url} returned status ${response.status}`);
            // Pre-emptively try first fallback if HEAD request fails, but don't override if image is already loading
            if (!imageLoaded && !imageError && retryCount === 0) {
              handleImageError();
            }
          } else {
            console.log(`✅ BattleCard image URL check: ${url} exists on server`);
            // Even if HEAD request succeeds, sometimes the image still fails to load
            // Set a longer timeout only if the image hasn't loaded yet, giving it more time
            if (!imageLoaded && !imageError) {
              imageLoadingTimerRef.current = setTimeout(() => {
                if (!imageLoaded && !imageError && isMountedRef.current) {
                  console.warn(`⏱️ Image load timeout for ${formattedName} after successful HEAD check - triggering fallback`);
                  handleImageError();
                }
              }, 15000); // Increased timeout (15 seconds) for high-res images
            }
          }
        })
        .catch(error => {
          if (!isMountedRef.current) return;
          
          console.warn(`⚠️ BattleCard image URL check failed for ${url}: ${error.message}`);
          // Pre-emptively try first fallback if HEAD request fails
          if (!imageLoaded && !imageError && retryCount === 0 && isMountedRef.current) {
            handleImageError();
          }
        });
      } else {
        console.warn(`⚠️ BattleCard: Empty URL generated for ${formattedName} (#${pokemonId})`);
        handleImageError();
      }
    }
  }, [pokemonId, formattedName, imageLoaded, imageError, retryCount, cleanupImageLoading]);

  // Update image when Pokemon changes
  useEffect(() => {
    console.log(`🏆 BattleCard: Rendering Pokemon ${formattedName} (#${pokemonId}) with isSelected=${isSelected}`);
    updateImage();
    
    const handlePreferenceChange = () => {
      // Reset the successful URL cache when preferences change
      successfulCacheBustedUrlRef.current = null;
      updateImage();
    };
    
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => {
      window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
      cleanupImageLoading();
    };
  }, [updateImage, validatedPokemon.id, formattedName, pokemonId, isSelected, cleanupImageLoading]);

  // Add a safety timeout to trigger fallback if image doesn't load in a reasonable time
  useEffect(() => {
    if (hasInitialLoadRef.current && !imageLoaded && !imageError) {
      cleanupImageLoading();
      
      imageLoadingTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        if (!imageLoaded && !imageError && retryCount === 0) {
          console.warn(`⏱️ Image load timeout for ${formattedName} - triggering fallback`);
          handleImageError();
        }
      }, 10000); // 10 second timeout (increased from 8 seconds)
      
      return () => cleanupImageLoading();
    }
  }, [imageLoaded, imageError, formattedName, retryCount, cleanupImageLoading]);

  // Save a reference to the img element
  const saveImgRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
  }, []);

  const handleImageLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    
    cleanupImageLoading();
    setImageLoaded(true);
    
    // If this was a cache-busted URL that loaded successfully, save it for future use
    if (currentImageUrl && currentImageUrl.includes('_cb=')) {
      successfulCacheBustedUrlRef.current = currentImageUrl;
    }
    
    if (retryCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${formattedName} in battle`);
    }
  }, [retryCount, currentImageType, formattedName, cleanupImageLoading, currentImageUrl]);
  
  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    cleanupImageLoading();
    
    // Get the failing URL
    const failedUrl = currentImageUrl || initialUrlRef.current;
    
    if (retryCount === 0) {
      if (!failedUrl || failedUrl.trim() === '') {
        // If URL is empty or undefined
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${formattedName} (#${pokemonId}) failed. No URL was available for the preferred style.`);
      } else {
        // Log the initial failure with the actual URL
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${formattedName} (#${pokemonId}) failed. URL: ${failedUrl}`);
        
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
            if (retryCount === 0 && isMountedRef.current) {
              const cacheBustUrl = `${failedUrl}?_cb=${Date.now()}`;
              console.log(`🔄 Attempting to load with cache busting: ${cacheBustUrl}`);
              
              // Try once more with cache busting before going to fallback
              const tempImg = new Image();
              tempImg.onload = () => {
                if (!isMountedRef.current) return;
                
                console.log(`✅ Cache-busted image loaded successfully: ${cacheBustUrl}`);
                setCurrentImageUrl(cacheBustUrl);
                setImageLoaded(true);
                successfulCacheBustedUrlRef.current = cacheBustUrl;
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
      if (!isMountedRef.current) return;
      
      if (retryCount < 3) { // Keep up to 3 retries to handle the new longer fallback chain
        const nextRetry = retryCount + 1;
        const nextUrl = getPreferredImageUrl(pokemonId, nextRetry);
        
        console.log(`❌ Battle image load failed for ${formattedName} (#${pokemonId}) with type "${currentImageType}" - trying fallback #${nextRetry}: ${nextUrl}`);
        
        setRetryCount(nextRetry);
        setCurrentImageUrl(nextUrl);
        
        // Preload the next image to check if it exists
        const img = new Image();
        img.src = nextUrl;
      } else {
        console.error(`⛔ All image fallbacks failed for ${formattedName} in battle`);
        setImageError(true);
        
        // Show toast only in development
        if (process.env.NODE_ENV === "development") {
          toast.error(`Failed to load image for ${formattedName}`, {
            description: "All fallback attempts failed"
          });
        }
      }
    }
  }, [pokemonId, formattedName, retryCount, currentImageUrl, currentImageType, cleanupImageLoading]);

  // Improved click handling with debounce
  const handleClick = useCallback(() => {
    if (isProcessing || clickDisabledRef.current) {
      console.log(`🚫 BattleCard click ignored: ${formattedName} because isProcessing=${isProcessing} or clickDisabled=${clickDisabledRef.current}`);
      return;
    }
    
    // Set click debounce flag to prevent rapid multi-clicks
    clickDisabledRef.current = true;
    
    console.log(`👆 BattleCard click: ${formattedName} (#${pokemonId})`);
    onSelect(pokemonId);
    
    // Clear click debounce after a short delay
    setTimeout(() => {
      clickDisabledRef.current = false;
    }, 800); // 800ms debounce for clicks
  }, [pokemonId, formattedName, onSelect, isProcessing]);

  return (
    <Card 
      className={`cursor-pointer transition-transform ${isSelected ? "ring-4 ring-primary" : ""} ${isProcessing ? "opacity-70 pointer-events-none" : "hover:scale-105"}`} 
      onClick={handleClick}
      data-selected={isSelected ? "true" : "false"}
      data-processing={isProcessing ? "true" : "false"}
      data-pokemon-id={pokemonId}
      aria-disabled={isProcessing}
    >
      <CardContent className="flex flex-col items-center p-4">
        <div className="w-32 h-32 relative bg-gray-100 rounded-md">
          {!imageLoaded && !imageError && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"></div>}
          {currentImageUrl && (
            <img
              ref={saveImgRef}
              src={currentImageUrl}
              alt={formattedName}
              className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"} force-visible`}
              style={{
                display: "block", 
                width: "100%",
                height: "100%",
                zIndex: 5
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="eager" // Use eager loading for battle cards as they're critical UI elements
              crossOrigin="anonymous" // Add cross-origin attribute to help with CORS issues
            />
          )}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-center p-1">
              <div className="text-xs font-medium">{formattedName}</div>
              <div className="text-xs text-muted-foreground">ID: {pokemonId}</div>
            </div>
          )}
          
          {/* Add a reliable test image that should always display - helps us diagnose CSS issues */}
          <div className="absolute top-0 right-0" style={{ width: "20px", height: "20px" }}>
            <img 
              src="https://via.placeholder.com/20/ff0000/ffffff" 
              alt="Test indicator"
              className="w-full h-full"
            />
          </div>
        </div>
        
        <h3 className="mt-2 text-xl font-bold">{formattedName}</h3>
        <div className="text-xs text-muted-foreground mt-1">#{pokemonId}</div>
        
        {/* Visual feedback when processing */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-md">
            <div className="h-8 w-8 border-4 border-t-primary animate-spin rounded-full"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

BattleCard.displayName = "BattleCard";
export default BattleCard;
