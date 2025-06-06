
import React from 'react';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import { Card } from '@/components/ui/card';
import PokemonInfoModal from '@/components/pokemon/PokemonInfoModal';
import PokemonCardImage from '@/components/pokemon/PokemonCardImage';
import PokemonCardInfo from '@/components/pokemon/PokemonCardInfo';

// Helper function to safely format Pokemon names without filtering
const safeFormatPokemonName = (name: string): string => {
  if (!name) return '';
  
  // Simple capitalization without any filtering logic
  return name.split(/(\s+|-+)/).map(part => {
    if (part.match(/^\s+$/) || part.match(/^-+$/)) {
      return part; // Keep whitespace and hyphens as-is
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
};

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending: boolean;
  showRank: boolean;
  isDraggable: boolean;
  isAvailable: boolean;
  context: 'available' | 'ranked';
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({
  pokemon,
  index,
  isPending,
  showRank,
  isDraggable,
  isAvailable,
  context
}) => {
  // CRITICAL FIX: Apply name formatting at the rendering level
  const formattedPokemon = {
    ...pokemon,
    name: safeFormatPokemonName(pokemon.name)
  };

  console.log(`🎨 [DRAGGABLE_CARD_FORMAT] Formatting ${pokemon.name} -> ${formattedPokemon.name}`);

  return (
    <Card className="relative group hover:shadow-lg transition-shadow bg-white border border-gray-200">
      <PokemonInfoModal pokemon={formattedPokemon}>
        <div className="p-4 cursor-pointer">
          <PokemonCardImage 
            pokemonId={formattedPokemon.id}
            displayName={formattedPokemon.name}
            imageUrl={formattedPokemon.image}
            compact={false}
            className=""
          />
          <PokemonCardInfo 
            pokemonId={formattedPokemon.id}
            displayName={formattedPokemon.name}
            types={formattedPokemon.types}
            flavorText={formattedPokemon.flavorText}
          />
        </div>
      </PokemonInfoModal>
      
      {showRank && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          #{index + 1}
        </div>
      )}
    </Card>
  );
};

export default DraggablePokemonMilestoneCard;
