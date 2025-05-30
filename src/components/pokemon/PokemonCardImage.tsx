
import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useImageLoader } from "@/hooks/pokemon/useImageLoader";
import { normalizePokedexNumber } from "@/utils/pokemon";

interface PokemonCardImageProps {
  pokemonId: number;
  displayName: string;
  compact?: boolean;
  imageUrl?: string;
}

const PokemonCardImage: React.FC<PokemonCardImageProps> = ({
  pokemonId,
  displayName,
  compact = false,
  imageUrl
}) => {
  console.log(`🖼️ [MANUAL_MODE_DEBUG] PokemonCardImage for ${displayName} (#${pokemonId})`);
  console.log(`🖼️ [MANUAL_MODE_DEBUG] Received imageUrl prop:`, imageUrl);
  
  const {
    imageLoaded,
    imageError,
    currentImageUrl,
    handleImageLoad,
    handleImageError,
    saveImgRef
  } = useImageLoader({ pokemonId, displayName });

  console.log(`🖼️ [MANUAL_MODE_DEBUG] Hook state for ${displayName}:`, {
    imageLoaded,
    imageError,
    currentImageUrl,
    hookWorking: !!currentImageUrl
  });

  const normalizedId = normalizePokedexNumber(pokemonId);

  // Use the hook's currentImageUrl which handles fallbacks properly
  // The imageUrl prop is now just for reference but we let the hook manage loading
  const finalImageUrl = currentImageUrl;

  console.log(`🖼️ [MANUAL_MODE_DEBUG] Final URL for ${displayName}:`, finalImageUrl);

  return (
    <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} bg-gray-50 rounded-md relative`}>
      <AspectRatio ratio={1}>
        {!imageLoaded && !imageError && <div className="animate-pulse bg-gray-200 absolute inset-0"></div>}
        {finalImageUrl && (
          <img
            ref={saveImgRef}
            src={finalImageUrl}
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
        {!finalImageUrl && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-red-100 text-xs p-1">
            <div className="font-medium text-red-600">NO URL</div>
            <div className="text-red-500">#{normalizedId}</div>
          </div>
        )}
      </AspectRatio>
    </div>
  );
};

export default PokemonCardImage;
