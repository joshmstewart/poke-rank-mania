
import React, { useState, useEffect } from "react";
import { TCGCard } from "@/hooks/pokemon/tcg/types";
import Logo from "@/components/ui/Logo";

interface TCGCardImageProps {
  tcgCard: TCGCard;
  displayName: string;
}

const TCGCardImage: React.FC<TCGCardImageProps> = ({ tcgCard, displayName }) => {
  const [cardImageLoaded, setCardImageLoaded] = useState(false);

  useEffect(() => {
    console.log(`📷 [TCG_CARD_IMAGE] ${displayName}: Using SMALL image URL: ${tcgCard.images.small}`);
    console.log(`📷 [TCG_CARD_IMAGE] ${displayName}: Large image URL (NOT USED): ${tcgCard.images.large}`);
  }, [tcgCard, displayName]);

  return (
    <div className="relative">
      <img 
        src={tcgCard.images.small} 
        alt={tcgCard.name}
        className={`w-full max-w-[200px] mx-auto rounded-lg shadow-md transition-opacity duration-300 ${
          cardImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          console.log(`✅ [TCG_CARD_IMAGE] ${displayName}: Small TCG image loaded successfully from: ${tcgCard.images.small}`);
          setCardImageLoaded(true);
        }}
        onError={(e) => {
          console.error(`🃏 [TCG_CARD_IMAGE] Failed to load TCG card SMALL image for ${displayName} from: ${tcgCard.images.small}`);
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
