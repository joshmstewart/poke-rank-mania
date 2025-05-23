
import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pokemon } from "@/services/pokemon";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";
import { normalizePokedexNumber, formatPokemonName } from "@/utils/pokemonUtils";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [currentImageType, setCurrentImageType] = useState<PokemonImageType>(getPreferredImageType());

  const normalizedId = normalizePokedexNumber(pokemon.id);
  const formattedName = formatPokemonName(pokemon.name);

  const updateImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    const preference = getPreferredImageType();
    setCurrentImageType(preference);
    const url = getPreferredImageUrl(pokemon.id);
    setCurrentImageUrl(url);
    
    // Add debug info to help investigate why official artwork might be failing
    if (process.env.NODE_ENV === "development") {
      console.log(`🖼️ PokemonCard: Loading "${preference}" image for ${formattedName} (#${pokemon.id}): ${url}`);
      
      // Verify if the URL actually exists with a HEAD request
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.warn(`⚠️ Image URL check: ${url} returned status ${response.status} - likely to fail loading`);
          } else {
            console.log(`✅ Image URL check: ${url} exists on server`);
          }
        })
        .catch(error => {
          console.warn(`⚠️ Image URL check failed for ${url}: ${error.message}`);
        });
    }
  }, [pokemon.id, formattedName]);

  useEffect(() => {
    updateImage();
    const handlePreferenceChange = () => updateImage();
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
  }, [updateImage]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (retryCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${formattedName}`);
    }
  };
  
  const handleImageError = () => {
    if (retryCount === 0) {
      // Log the initial failure of the preferred image type
      console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${formattedName} (#${pokemon.id}) failed. URL: ${currentImageUrl}`);
    }
    
    if (retryCount < 3) {
      const nextRetry = retryCount + 1;
      const nextUrl = getPreferredImageUrl(pokemon.id, nextRetry);
      
      // Enhanced error logging to diagnose why official artwork is failing
      console.log(`❌ Image load failed for ${formattedName} (#${pokemon.id}) with type "${currentImageType}" - trying fallback #${nextRetry}: ${nextUrl}`);
      
      setRetryCount(nextRetry);
      setCurrentImageUrl(nextUrl);
      
      // Preload the next image
      const img = new Image();
      img.src = nextUrl;
    } else {
      console.error(`⛔ All image fallbacks failed for ${formattedName} (#${pokemon.id})`);
      setImageError(true);
    }
  };

  return (
    <Card className={`w-full overflow-hidden ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-start p-3 gap-3">
        <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} bg-gray-50 rounded-md relative`}>
          <AspectRatio ratio={1}>
            {!imageLoaded && !imageError && <div className="animate-pulse bg-gray-200 absolute inset-0"></div>}
            <img
              src={currentImageUrl}
              alt={formattedName}
              className={`w-full h-full object-contain p-1 transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {imageError && <div className="absolute inset-0 flex justify-center items-center bg-gray-100 text-xs">{formattedName}</div>}
          </AspectRatio>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`flex justify-between ${compact ? "text-sm" : "text-base"}`}>
            <span className="font-medium truncate">{formattedName}</span>
            <span className="text-xs">#{normalizedId}</span>
          </div>
          {pokemon.types?.length && (
            <div className="flex gap-1 mt-1">
              {pokemon.types.map(type => (
                <Badge key={type} className={`${typeColors[type]} text-xs px-1.5 py-0.5`}>{type}</Badge>
              ))}
            </div>
          )}
          {!compact && pokemon.flavorText && <div className="text-xs mt-1 line-clamp-2 text-muted-foreground">{pokemon.flavorText}</div>}
        </div>
      </div>
    </Card>
  );
};

export default PokemonCard;
