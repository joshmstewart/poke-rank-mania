
import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useImageLoader } from "@/hooks/pokemon/useImageLoader";
import { normalizePokedexNumber } from "@/utils/pokemon";

interface PokemonCardImageProps {
  pokemonId: number;
  displayName: string;
  compact?: boolean;
}

const PokemonCardImage: React.FC<PokemonCardImageProps> = ({
  pokemonId,
  displayName,
  compact = false
}) => {
  const {
    imageLoaded,
    imageError,
    currentImageUrl,
    handleImageLoad,
    handleImageError,
    saveImgRef
  } = useImageLoader({ pokemonId, displayName });

  const normalizedId = normalizePokedexNumber(pokemonId);

  return (
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
  );
};

export default PokemonCardImage;
