
import React from 'react';
import { Card } from '@/components/ui/card';
import { useTCGImageCache } from '@/hooks/useTCGImageCache';
import Logo from '@/components/ui/Logo';

interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity?: string;
  set: {
    id: string;
    name: string;
    series: string;
  };
  images: {
    small: string;
    large: string;
  };
  flavorText?: string;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
}

interface PokemonTCGCardDisplayProps {
  tcgCard: TCGCard;
  secondCard?: TCGCard;
}

const PokemonTCGCardDisplay: React.FC<PokemonTCGCardDisplayProps> = ({ tcgCard, secondCard }) => {
  const CardDisplay = ({ card }: { card: TCGCard }) => {
    // Use the TCG image cache for large images
    const { cachedImageUrl, isLoading, error } = useTCGImageCache(
      card.images.large,
      `tcg-card-${card.id}-large`
    );

    console.log(`📷 [TCG_CARD_DISPLAY] ${card.name}: Using cached LARGE image URL: ${cachedImageUrl || card.images.large}`);
    console.log(`📷 [TCG_CARD_DISPLAY] ${card.name}: Small image URL (NOT USED): ${card.images.small}`);
    
    const imageUrl = cachedImageUrl || card.images.large;

    if (isLoading) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-sm h-[400px] flex items-center justify-center">
            <div className="animate-pulse">
              <Logo />
            </div>
          </div>
          <Card className="p-3 w-full">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-700">Loading...</p>
            </div>
          </Card>
        </div>
      );
    }

    if (error) {
      console.error(`❌ [TCG_CARD_DISPLAY] Error loading cached image for ${card.name}:`, error);
    }
    
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={card.name}
            className="w-full max-w-sm rounded-lg shadow-lg"
            onLoad={() => {
              console.log(`✅ [TCG_CARD_DISPLAY] ${card.name}: Large TCG image loaded successfully from: ${imageUrl}`);
            }}
            onError={(e) => {
              console.error(`❌ [TCG_CARD_DISPLAY] Failed to load TCG card LARGE image for ${card.name} from: ${imageUrl}`);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Pack, Generation, and Rarity information at bottom */}
        <Card className="p-3 w-full">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">
              {card.set.name}
            </p>
            <p className="text-xs text-gray-500">
              {card.set.series}
            </p>
            {card.rarity && (
              <p className="text-xs font-medium text-blue-600">
                {card.rarity}
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* First card */}
      <CardDisplay card={tcgCard} />
      
      {/* Second card - show the same card for now since we only have one */}
      <CardDisplay card={secondCard || tcgCard} />
    </div>
  );
};

export default PokemonTCGCardDisplay;
