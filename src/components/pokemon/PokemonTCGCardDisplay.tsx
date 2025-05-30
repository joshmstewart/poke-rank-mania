
import React from 'react';
import { Card } from '@/components/ui/card';

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
  const CardDisplay = ({ card }: { card: TCGCard }) => (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <img 
          src={card.images.small} 
          alt={card.name}
          className="w-full max-w-sm rounded-lg shadow-lg"
          onError={(e) => {
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
