
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import { usePokemonCardEvents } from "./PokemonCardEvents";
import PendingBanner from "./PendingBanner";
import PokemonCardContent from "./PokemonCardContent";

interface DraggablePokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
}

const DraggablePokemonCard: React.FC<DraggablePokemonCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false 
}) => {
  console.log(`🚨 [CARD_SETUP_DEBUG] ===== RENDERING CARD ${pokemon.name} =====`);
  console.log(`🚨 [CARD_SETUP_DEBUG] isPending: ${isPending}`);

  const sortableResult = useSortable({ 
    id: pokemon.id,
    data: {
      pokemon,
      index
    }
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  const {
    handlePointerDown,
    handleMouseDown,
    handleTouchStart,
    handleClick
  } = usePokemonCardEvents({
    pokemonName: pokemon.name,
    pokemonId: pokemon.id,
    listeners
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col select-none touch-none cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      {...attributes}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <PendingBanner isPending={isPending} />
      <PokemonCardContent pokemon={pokemon} index={index} isPending={isPending} />
    </div>
  );
};

export default DraggablePokemonCard;
