
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pokemon } from "@/services/pokemon";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDragging?: boolean;
  viewMode?: "list" | "grid";
  compact?: boolean;
}

const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-red-500", Water: "bg-blue-500", Electric: "bg-yellow-400",
  Grass: "bg-green-500", Ice: "bg-blue-200", Fighting: "bg-red-700", Poison: "bg-purple-600",
  Ground: "bg-yellow-700", Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-stone-500", Ghost: "bg-purple-700", Dragon: "bg-indigo-600", Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

const PokemonCard = ({ pokemon, isDragging, compact }: PokemonCardProps) => {
  // Validate the Pokemon to ensure image and name consistency
  const validatedPokemon = useMemo(() => {
    const [validated] = validateBattlePokemon([pokemon]);
    return validated;
  }, [pokemon]);

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

  // Store the consistent pokemon ID
  const pokemonId = validatedPokemon.id;

  // CRITICAL FIX: Use the name EXACTLY as-is from validatedPokemon - NO MORE FORMATTING
  const normalizedId = normalizePokedexNumber(pokemonId);
  const displayName = validatedPokemon.name; // Use name exactly as provided
  
  // Enhanced debugging for Pokemon name in PokemonCard
  console.log(`🎮 [POKEMON_CARD_NAME_FINAL] Pokemon ID: ${pokemonId}, Display name: "${displayName}" (NO FORMATTING APPLIED)`);

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
  }, [pokemonId, displayName, imageLoaded, imageError, retryCount, cleanupImageLoading]);

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
  }, [imageLoaded, imageError, displayName, retryCount, cleanupImageLoading]);

  // Save a reference to the img element
  const saveImgRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
  }, []);

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

  return (
    <Card className={`w-full overflow-hidden ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-start p-3 gap-3">
        <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} bg-gray-50 rounded-md relative`}>
          <AspectRatio ratio={1}>
            {!imageLoaded && !imageError && <div className="animate-pulse bg-gray-200 absolute inset-0"></div>}
            {currentImageUrl && (
              <img
                ref={saveImgRef}
                src={currentImageUrl}
                alt={displayName}
                className={`w-full h-full object-contain p-1 transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            )}
            {imageError && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 text-xs p-1">
                <div className="font-medium">{displayName}</div>
                <div className="text-muted-foreground">#{normalizedId}</div>
              </div>
            )}
          </AspectRatio>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`flex justify-between ${compact ? "text-sm" : "text-base"}`}>
            <span className="font-medium truncate">{displayName}</span>
            <span className="text-xs">#{normalizedId}</span>
          </div>
          {validatedPokemon.types?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {validatedPokemon.types.map(type => (
                <Badge key={type} className={`${typeColors[type]} text-xs px-1.5 py-0.5`}>{type}</Badge>
              ))}
            </div>
          )}
          {!compact && validatedPokemon.flavorText && <div className="text-xs mt-1 line-clamp-2 text-muted-foreground">{validatedPokemon.flavorText}</div>}
        </div>
      </div>
    </Card>
  );
};

export default PokemonCard;
