
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pokemon } from "@/services/pokemon";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getPokemonImageUrl } from "@/services/pokemon/api/utils";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDragging?: boolean;
  viewMode?: "list" | "grid";
  compact?: boolean;
}

// Map of Pokemon types to colors
const typeColors: Record<string, string> = {
  Normal: "bg-gray-400",
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Electric: "bg-yellow-400",
  Grass: "bg-green-500",
  Ice: "bg-blue-200",
  Fighting: "bg-red-700",
  Poison: "bg-purple-600",
  Ground: "bg-yellow-700",
  Flying: "bg-indigo-300",
  Psychic: "bg-pink-500",
  Bug: "bg-lime-500",
  Rock: "bg-stone-500",
  Ghost: "bg-purple-700",
  Dragon: "bg-indigo-600",
  Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400",
  Fairy: "bg-pink-300",
};

const PokemonCard = ({ pokemon, isDragging, viewMode = "list", compact }: PokemonCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");

  // Reset image states when pokemon changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    // Always start with the preferred image type
    const preferredImageUrl = getPokemonImageUrl(pokemon.id, 0);
    setCurrentImageUrl(preferredImageUrl);
    
    // Preload the image
    const preloadImage = new Image();
    preloadImage.src = preferredImageUrl;
  }, [pokemon.id, pokemon.image]);

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle image load error with more robust retry logic
  const handleImageError = () => {
    if (retryCount < maxRetries) {
      // Try a different image source
      setRetryCount(prev => prev + 1);
      setImageError(true);
      
      // Immediately try the next fallback URL using our utility function
      const nextUrl = getPokemonImageUrl(pokemon.id, retryCount + 1);
      console.log(`Trying fallback URL for ${pokemon.name}: ${nextUrl}`);
      setCurrentImageUrl(nextUrl);
    } else {
      // After max retries, stay in error state
      console.log(`All fallbacks failed for Pokemon: ${pokemon.name}`);
      setImageError(true);
    }
  };

  if (viewMode === "grid") {
    return (
      <div 
        className={`aspect-square relative rounded-md overflow-hidden cursor-grab active:cursor-grabbing ${
          isDragging ? "opacity-50" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {!imageLoaded && !imageError && (
            <div className="animate-pulse bg-gray-200 w-full h-full absolute"></div>
          )}
          <img 
            src={currentImageUrl} 
            alt={pokemon.name}
            className={`w-full h-full object-contain ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError && retryCount >= maxRetries && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
              <div className="text-sm text-gray-500 text-center p-2">
                {pokemon.name}<br/>(#{pokemon.id})
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-white text-shadow">{pokemon.name}</div>
            <div className="text-xs text-white text-shadow">#{pokemon.id}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={`w-full overflow-hidden ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${compact ? "" : ""} transition-all`}
    >
      <div className="flex items-start p-3 gap-3">
        <div className={`flex-shrink-0 ${compact ? "w-16 h-16" : "w-20 h-20"} bg-gray-50 rounded-md overflow-hidden relative`}>
          <AspectRatio ratio={1 / 1} className="h-full">
            {!imageLoaded && !imageError && (
              <div className="animate-pulse bg-gray-200 w-full h-full absolute"></div>
            )}
            <img 
              src={currentImageUrl} 
              alt={pokemon.name} 
              className={`w-full h-full object-contain p-1 ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {imageError && retryCount >= maxRetries && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
                <div className="text-xs text-gray-500">{pokemon.name}<br/>(#{pokemon.id})</div>
              </div>
            )}
          </AspectRatio>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className={`font-medium truncate ${compact ? "text-sm" : "text-base"}`}>{pokemon.name}</div>
              <div className="text-xs text-muted-foreground shrink-0 ml-1">#{pokemon.id}</div>
            </div>
            
            {pokemon.types && pokemon.types.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {pokemon.types.map((type) => (
                  <Badge 
                    key={type} 
                    className={`${typeColors[type] || 'bg-gray-500'} text-xs px-1.5 py-0.5`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            )}
            
            {!compact && pokemon.flavorText && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {pokemon.flavorText}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PokemonCard;
