
import React, { useState, useCallback } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { normalizePokedexNumber } from "@/utils/pokemon";

interface PokemonCardImageProps {
  pokemonId: number;
  displayName: string;
  compact?: boolean;
  imageUrl?: string;
  className?: string;
}

const PokemonCardImage: React.FC<PokemonCardImageProps> = ({
  pokemonId,
  displayName,
  compact = false,
  imageUrl,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  console.log(`🖼️ [SIMPLE_IMAGE_DEBUG] ${displayName}: imageUrl=${imageUrl}, loaded=${imageLoaded}, error=${imageError}`);

  const normalizedId = normalizePokedexNumber(pokemonId);

  const handleImageLoad = useCallback(() => {
    console.log(`✅ [SIMPLE_IMAGE_DEBUG] Image loaded for ${displayName}`);
    setImageLoaded(true);
    setImageError(false);
  }, [displayName]);

  const handleImageError = useCallback(() => {
    console.log(`❌ [SIMPLE_IMAGE_DEBUG] Image failed for ${displayName}`);
    setImageLoaded(false);
    setImageError(true);
  }, [displayName]);

  // Reset states when imageUrl changes
  React.useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

  return (
    <div className={`${compact ? "w-12 h-12" : "w-16 h-16"} bg-gray-50 rounded-md relative flex-shrink-0 ${className || ""}`}>
      <AspectRatio ratio={1}>
        {!imageLoaded && !imageError && imageUrl && (
          <div className="animate-pulse bg-gray-200 absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={displayName}
            className={`w-full h-full object-contain p-0.5 transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            crossOrigin="anonymous"
          />
        )}
        {imageError && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 text-xs p-1">
            <div className="font-medium text-red-600 text-xs">{displayName}</div>
            <div className="text-red-500 text-xs">#{normalizedId}</div>
            <div className="text-red-400 text-center text-xs">Error</div>
          </div>
        )}
        {!imageUrl && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-red-100 text-xs p-1">
            <div className="font-medium text-red-600 text-xs">NO URL</div>
            <div className="text-red-500 text-xs">#{normalizedId}</div>
            <div className="text-red-400 text-xs">{displayName}</div>
          </div>
        )}
      </AspectRatio>
    </div>
  );
};

export default PokemonCardImage;
