
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
}

const PokemonTCGCardDisplay: React.FC<PokemonTCGCardDisplayProps> = ({ tcgCard }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left side - TCG Card image */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <img 
            src={tcgCard.images.large} 
            alt={tcgCard.name}
            className="w-full max-w-sm rounded-lg shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Set information */}
        <Card className="p-3 w-full">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">
              {tcgCard.set.name}
            </p>
            <p className="text-xs text-gray-500">
              {tcgCard.set.series}
            </p>
            {tcgCard.rarity && (
              <p className="text-xs font-medium text-blue-600">
                {tcgCard.rarity}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Right side - Card details */}
      <div className="space-y-4">
        {/* Basic stats */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3">Card Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{tcgCard.supertype}</span>
            </div>
            
            {tcgCard.subtypes && tcgCard.subtypes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtype:</span>
                <span className="font-medium">{tcgCard.subtypes.join(', ')}</span>
              </div>
            )}
            
            {tcgCard.hp && (
              <div className="flex justify-between">
                <span className="text-gray-600">HP:</span>
                <span className="font-medium text-red-600">{tcgCard.hp}</span>
              </div>
            )}
            
            {tcgCard.types && tcgCard.types.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Energy Type:</span>
                <span className="font-medium">{tcgCard.types.join(', ')}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Flavor text */}
        {tcgCard.flavorText && (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "{tcgCard.flavorText}"
            </p>
          </Card>
        )}

        {/* Attacks */}
        {tcgCard.attacks && tcgCard.attacks.length > 0 && (
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Attacks</h4>
            <div className="space-y-3">
              {tcgCard.attacks.slice(0, 2).map((attack, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{attack.name}</span>
                    {attack.damage && (
                      <span className="text-red-600 font-bold">{attack.damage}</span>
                    )}
                  </div>
                  {attack.text && (
                    <p className="text-xs text-gray-600">{attack.text}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PokemonTCGCardDisplay;
