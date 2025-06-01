
import React, { useState, useEffect } from "react";
import { TCGCard } from "@/hooks/pokemon/tcg/types";
import Logo from "@/components/ui/Logo";
import { useTCGImageCache } from "@/hooks/useTCGImageCache";

interface TCGCardImageProps {
  tcgCard: TCGCard;
  displayName: string;
}

const TCGCardImage: React.FC<TCGCardImageProps> = ({ tcgCard, displayName }) => {
  const [cardImageLoaded, setCardImageLoaded] = useState(false);
  
  // Use the TCG image cache for small images
  const { cachedImageUrl, isLoading, error } = useTCGImageCache(
    tcgCard.images.small,
    `tcg-card-${tcgCard.id}-small`
  );

  useEffect(() => {
    console.log(`📷 [TCG_CARD_IMAGE] ${displayName}: Using cached SMALL image URL: ${cachedImageUrl || tcgCard.images.small}`);
    console.log(`📷 [TCG_CARD_IMAGE] ${displayName}: Large image URL (NOT USED): ${tcgCard.images.large}`);
  }, [tcgCard, displayName, cachedImageUrl]);

  const imageUrl = cachedImageUrl || tcgCard.images.small;

  if (isLoading) {
    return (
      <div className="relative w-full max-w-[200px] mx-auto h-[280px] flex items-center justify-center">
        <div className="animate-pulse">
          <Logo />
        </div>
      </div>
    );
  }

  if (error) {
    console.error(`🃏 [TCG_CARD_IMAGE] Error loading cached image for ${displayName}:`, error);
  }

  return (
    <div className="relative">
      <img 
        src={imageUrl} 
        alt={tcgCard.name}
        className={`w-full max-w-[200px] mx-auto rounded-lg shadow-md transition-opacity duration-300 ${
          cardImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          console.log(`✅ [TCG_CARD_IMAGE] ${displayName}: Small TCG image loaded successfully from: ${imageUrl}`);
          setCardImageLoaded(true);
        }}
        onError={(e) => {
          console.error(`🃏 [TCG_CARD_IMAGE] Failed to load TCG card SMALL image for ${displayName} from: ${imageUrl}`);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      {!cardImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse">
            <Logo />
          </div>
        </div>
      )}
    </div>
  );
};

export default TCGCardImage;
