
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
  console.log(`🖼️ [IMAGE_DEBUG] ===== PokemonCardImage START =====`);
  console.log(`🖼️ [IMAGE_DEBUG] Pokemon: ${displayName} (#${pokemonId})`);
  console.log(`🖼️ [IMAGE_DEBUG] Received imageUrl prop:`, imageUrl);
  console.log(`🖼️ [IMAGE_DEBUG] ImageUrl type:`, typeof imageUrl);
  console.log(`🖼️ [IMAGE_DEBUG] ImageUrl length:`, imageUrl?.length);
  
  const {
    imageLoaded,
    imageError,
    currentImageUrl,
    handleImageLoad,
    handleImageError,
    saveImgRef
  } = useImageLoader({ pokemonId, displayName });

  console.log(`🖼️ [IMAGE_DEBUG] Hook returned:`, {
    imageLoaded,
    imageError,
    currentImageUrl,
    currentImageUrlType: typeof currentImageUrl,
    currentImageUrlLength: currentImageUrl?.length
  });

  const normalizedId = normalizePokedexNumber(pokemonId);

  // If we have an imageUrl prop and no currentImageUrl from hook, use the prop
  let finalImageUrl = currentImageUrl;
  if (!currentImageUrl && imageUrl) {
    console.log(`🖼️ [IMAGE_DEBUG] Using imageUrl prop as fallback:`, imageUrl);
    finalImageUrl = imageUrl;
  }

  console.log(`🖼️ [IMAGE_DEBUG] Final URL for ${displayName}:`, finalImageUrl);
  console.log(`🖼️ [IMAGE_DEBUG] ===== PokemonCardImage END =====`);

  return (
    <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} bg-gray-50 rounded-md relative`}>
      <AspectRatio ratio={1}>
        {!imageLoaded && !imageError && (
          <div className="animate-pulse bg-gray-200 absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}
        {finalImageUrl && (
          <img
            ref={saveImgRef}
            src={finalImageUrl}
            alt={displayName}
            className={`w-full h-full object-contain p-1 transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => {
              console.log(`✅ [IMAGE_DEBUG] Image loaded successfully for ${displayName}:`, finalImageUrl);
              handleImageLoad();
            }}
            onError={(e) => {
              console.error(`❌ [IMAGE_DEBUG] Image failed to load for ${displayName}:`, finalImageUrl);
              console.error(`❌ [IMAGE_DEBUG] Error event:`, e);
              handleImageError();
            }}
            crossOrigin="anonymous"
          />
        )}
        {imageError && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 text-xs p-1">
            <div className="font-medium text-red-600">{displayName}</div>
            <div className="text-red-500">#{normalizedId}</div>
            <div className="text-red-400 text-center">Error</div>
          </div>
        )}
        {!finalImageUrl && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-red-100 text-xs p-1">
            <div className="font-medium text-red-600">NO URL</div>
            <div className="text-red-500">#{normalizedId}</div>
            <div className="text-red-400">{displayName}</div>
          </div>
        )}
      </AspectRatio>
    </div>
  );
};

export default PokemonCardImage;
