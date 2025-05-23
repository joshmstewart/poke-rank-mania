
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pokemon } from "@/services/pokemon";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";
import { normalizePokedexNumber, formatPokemonName } from "@/utils/pokemonUtils";
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
  const initialUrlRef = useRef<string>(""); // Using ref to ensure it doesn't change
  const hasInitialLoadRef = useRef<boolean>(false); // Track if we've attempted the first load

  // Store the consistent pokemon ID
  const pokemonId = validatedPokemon.id;

  // Use formatPokemonName for proper display of regional variants
  const normalizedId = normalizePokedexNumber(pokemonId);
  const formattedName = formatPokemonName(validatedPokemon.name);

  // Log the Pokemon data to help diagnose issues
  useEffect(() => {
    console.log(`🃏 PokemonCard: Rendering ${formattedName} (ID: ${pokemonId})`);
  }, [formattedName, pokemonId]);

  const updateImage = useCallback(() => {
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
      console.log(`🖼️ PokemonCard: Loading "${preference}" image for ${formattedName} (#${pokemonId}): ${url}`);
      
      // Verify if the URL actually exists with a HEAD request - always do this
      if (url && url.trim() !== '') {
        fetch(url, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              console.warn(`⚠️ Image URL check: ${url} returned status ${response.status} - likely to fail loading`);
              // Pre-emptively try first fallback if HEAD request fails
              if (!imageLoaded && !imageError && retryCount === 0) {
                handleImageError();
              }
            } else {
              console.log(`✅ Image URL check: ${url} exists on server`);
            }
          })
          .catch(error => {
            console.warn(`⚠️ Image URL check failed for ${url}: ${error.message}`);
            // Pre-emptively try first fallback if HEAD request fails
            if (!imageLoaded && !imageError && retryCount === 0) {
              handleImageError();
            }
          });
      } else {
        console.warn(`⚠️ PokemonCard: Empty URL generated for ${formattedName} (#${pokemonId})`);
        handleImageError();
      }
    }
  }, [pokemonId, formattedName, imageLoaded, imageError, retryCount]);

  useEffect(() => {
    updateImage();
    const handlePreferenceChange = () => updateImage();
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
  }, [updateImage]);

  // Add a safety timeout to trigger fallback if image doesn't load in a reasonable time
  useEffect(() => {
    if (hasInitialLoadRef.current && !imageLoaded && !imageError) {
      const safetyTimer = setTimeout(() => {
        if (!imageLoaded && !imageError && retryCount === 0) {
          console.warn(`⏱️ Image load timeout for ${formattedName} - triggering fallback`);
          handleImageError();
        }
      }, 2000); // 2 second timeout
      
      return () => clearTimeout(safetyTimer);
    }
  }, [imageLoaded, imageError, formattedName, retryCount]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (retryCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${formattedName}`);
    }
  };
  
  const handleImageError = () => {
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
        fetch(failedUrl, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              console.error(`🔴 Confirmed: URL ${failedUrl} returned ${response.status} from server`);
            } else {
              console.error(`❓ Unexpected: URL ${failedUrl} exists on server but image still failed to load`);
            }
          })
          .catch(error => {
            console.error(`🔴 Network error checking ${failedUrl}: ${error.message}`);
          });
      }
    }
    
    if (retryCount < 3) {  // Keep up to 3 retries to handle the new longer fallback chain
      const nextRetry = retryCount + 1;
      const nextUrl = getPreferredImageUrl(pokemonId, nextRetry);
      
      // Enhanced error logging to diagnose why official artwork is failing
      console.log(`❌ Image load failed for ${formattedName} (#${pokemonId}) with type "${currentImageType}" - trying fallback #${nextRetry}: ${nextUrl}`);
      
      setRetryCount(nextRetry);
      setCurrentImageUrl(nextUrl);
      
      // Preload the next image to check if it exists
      const img = new Image();
      img.src = nextUrl;
    } else {
      console.error(`⛔ All image fallbacks failed for ${formattedName} (#${pokemonId})`);
      setImageError(true);
    }
  };

  return (
    <Card className={`w-full overflow-hidden ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-start p-3 gap-3">
        <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} bg-gray-50 rounded-md relative`}>
          <AspectRatio ratio={1}>
            {!imageLoaded && !imageError && <div className="animate-pulse bg-gray-200 absolute inset-0"></div>}
            {currentImageUrl && (
              <img
                src={currentImageUrl}
                alt={formattedName}
                className={`w-full h-full object-contain p-1 transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            {imageError && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 text-xs p-1">
                <div className="font-medium">{formattedName}</div>
                <div className="text-muted-foreground">#{normalizedId}</div>
              </div>
            )}
          </AspectRatio>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`flex justify-between ${compact ? "text-sm" : "text-base"}`}>
            <span className="font-medium truncate">{formattedName}</span>
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
