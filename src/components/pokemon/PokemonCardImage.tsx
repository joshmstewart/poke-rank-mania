
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

  const normalizedId = normalizePokedexNumber(pokemonId);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageError(true);
  }, []);

  // Reset states when imageUrl changes
  React.useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

  // Use the actual imageUrl that's passed in, which should be the validated one
  const finalImageUrl = imageUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

  // SIGNIFICANTLY increased image container sizes - making them much larger
  const imageSize = compact ? "w-24 h-24" : "w-40 h-40";

  console.log(`🖼️ [POKEMON_CARD_IMAGE] ${displayName}: Using size ${imageSize} (compact: ${compact})`);

  return (
    <div className={`${imageSize} ${className || ""} bg-gray-50 rounded-md relative flex-shrink-0`}>
      <AspectRatio ratio={1}>
        {!imageLoaded && !imageError && finalImageUrl && (
          <div className="animate-pulse bg-gray-200 absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-500">...</span>
          </div>
        )}
        {finalImageUrl && !imageError && (
          <img
            src={finalImageUrl}
            alt={displayName}
            className={`w-full h-full object-contain p-1 transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
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
        {!finalImageUrl && (
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
