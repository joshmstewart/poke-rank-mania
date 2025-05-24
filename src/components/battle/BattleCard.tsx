
import React, { memo, useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";
import { formatPokemonName } from "@/utils/pokemonUtils";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

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
  const pokemonId = validatedPokemon.id;

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
    
    cleanupImageLoading();
    
    if (!isMountedRef.current) return;
    
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    const preference = getPreferredImageType();
    setCurrentImageType(preference);
    
    const url = getPreferredImageUrl(pokemonId);
    setCurrentImageUrl(url);
    initialUrlRef.current = url;
    hasInitialLoadRef.current = true;
    
    console.log(`🖼️ BattleCard: Loading "${preference}" image for ${formattedName} (#${pokemonId}): ${url}`);
  }, [pokemonId, formattedName, cleanupImageLoading]);

  // Update image when Pokemon changes
  useEffect(() => {
    console.log(`🏆 BattleCard: Rendering Pokemon ${formattedName} (#${pokemonId}) with isSelected=${isSelected}`);
    updateImage();
    
    const handlePreferenceChange = () => {
      successfulCacheBustedUrlRef.current = null;
      updateImage();
    };
    
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => {
      window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
      cleanupImageLoading();
    };
  }, [updateImage, validatedPokemon.id, formattedName, pokemonId, isSelected, cleanupImageLoading]);

  // FIXED: Reduced timeout for better performance
  useEffect(() => {
    if (hasInitialLoadRef.current && !imageLoaded && !imageError) {
      cleanupImageLoading();
      
      imageLoadingTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        if (!imageLoaded && !imageError && retryCount === 0) {
          console.warn(`⏱️ Image load timeout for ${formattedName} - triggering fallback`);
          handleImageError();
        }
      }, 5000); // Reduced from 10000ms
      
      return () => cleanupImageLoading();
    }
  }, [imageLoaded, imageError, formattedName, retryCount, cleanupImageLoading]);

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
    
    if (retryCount > 0) {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${formattedName} in battle`);
    }
  }, [retryCount, currentImageType, formattedName, cleanupImageLoading, currentImageUrl]);
  
  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    cleanupImageLoading();
    
    const failedUrl = currentImageUrl || initialUrlRef.current;
    
    if (retryCount < 3) {
      const nextRetry = retryCount + 1;
      const nextUrl = getPreferredImageUrl(pokemonId, nextRetry);
      
      console.log(`❌ Battle image load failed for ${formattedName} (#${pokemonId}) - trying fallback #${nextRetry}: ${nextUrl}`);
      
      setRetryCount(nextRetry);
      setCurrentImageUrl(nextUrl);
    } else {
      console.error(`⛔ All image fallbacks failed for ${formattedName} in battle`);
      setImageError(true);
    }
  }, [pokemonId, formattedName, retryCount, currentImageUrl, cleanupImageLoading]);

  // FIXED: Improved click handling with clearer conditions
  const handleClick = useCallback(() => {
    // Only ignore clicks if truly processing
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
    }, 500); // Reduced from 800ms for better responsiveness
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
              className={`w-full h-full object-contain transition-opacity duration-200 force-visible ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="eager"
              crossOrigin="anonymous"
            />
          )}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-center p-1">
              <div className="text-xs font-medium">{formattedName}</div>
              <div className="text-xs text-muted-foreground">ID: {pokemonId}</div>
            </div>
          )}
        </div>
        
        <h3 className="mt-2 text-xl font-bold">{formattedName}</h3>
        <div className="text-xs text-muted-foreground mt-1">#{pokemonId}</div>
        
        {/* FIXED: Simpler processing indicator */}
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
