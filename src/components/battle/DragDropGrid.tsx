
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import PokemonCardImage from "@/components/pokemon/PokemonCardImage";
import { getPokemonTypeColor } from "@/components/battle/utils/pokemonTypeColors";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (activeId: number, overId: number) => void;
  onLocalReorder: (activeId: number, overId: number) => void;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon: Pokemon[];
  isAvailableSection?: boolean;
}

const DraggablePokemonCard: React.FC<{
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isAvailableSection?: boolean;
}> = ({ pokemon, index, isAvailableSection = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pokemon.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isRankedPokemon = 'score' in pokemon;
  const backgroundColor = getPokemonTypeColor(pokemon);
  const formattedId = pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0');

  // Calculate current rank for ranked Pokemon in available section
  const getCurrentRank = () => {
    if (isRankedPokemon && isAvailableSection) {
      // For available section, we need to determine rank based on index in rankings
      // This would typically come from the parent component's ranking data
      return index + 1; // Fallback - this should be passed from parent
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className={`${backgroundColor} relative group hover:shadow-lg transition-shadow border border-gray-200`}>
        {/* Info Button - top right */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal pokemon={pokemon} />
        </div>
        
        {/* Rank Badge - for rankings section */}
        {!isAvailableSection && (
          <div className="absolute top-2 left-2 z-20">
            <Badge 
              variant="secondary" 
              className="bg-white/90 text-gray-800 font-bold text-sm px-2 py-1 shadow-md flex items-center gap-1"
            >
              {index + 1}
            </Badge>
          </div>
        )}
        
        {/* Crown badge for ranked Pokemon in available section */}
        {isAvailableSection && isRankedPokemon && (
          <div className="absolute top-2 left-2 z-20">
            <Badge 
              variant="secondary" 
              className="bg-yellow-500 text-white font-bold text-xs px-2 py-1 shadow-md flex items-center gap-1"
            >
              <Crown size={12} />
              #{getCurrentRank()}
            </Badge>
          </div>
        )}

        <div className="p-4 text-center">
          {/* Pokemon Image */}
          <PokemonCardImage 
            pokemonId={pokemon.id}
            displayName={pokemon.name}
            imageUrl={pokemon.image}
            className="mb-3 mx-auto"
          />
          
          {/* Pokemon Name */}
          <div className="font-semibold text-gray-800 text-sm mb-1 leading-tight">
            {pokemon.name}
          </div>
          
          {/* Pokemon ID */}
          <div className="text-xs text-gray-600 mb-2">
            #{formattedId}
          </div>
          
          {/* Score display - only show for rankings section */}
          {!isAvailableSection && isRankedPokemon && (
            <div className="text-xs text-gray-700 font-medium">
              Score: {(pokemon as RankedPokemon).score.toFixed(1)}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon,
  isAvailableSection = false
}) => {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {displayRankings.map((pokemon, index) => (
        <DraggablePokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          isAvailableSection={isAvailableSection}
        />
      ))}
    </div>
  );
};

export default DragDropGrid;
