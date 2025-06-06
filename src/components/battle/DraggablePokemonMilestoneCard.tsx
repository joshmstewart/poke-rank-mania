
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import PokemonCardContent from "./PokemonCardContent";
import { PriorityStarButton } from "./PriorityStarButton";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon;
  index: number;
  isPending: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: string;
  showPriorityStar?: boolean;
  isPrioritySelected?: boolean;
  onTogglePriority?: (pokemonId: number) => void;
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({ 
  pokemon, 
  index, 
  isPending,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = "milestone",
  showPriorityStar = false,
  isPrioritySelected = false,
  onTogglePriority
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `${context}-${pokemon.id}`,
    data: {
      type: isAvailable ? 'available-pokemon' : 'ranked-pokemon',
      pokemon,
      context,
      index
    },
    disabled: !isDraggable
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handlePriorityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePriority) {
      onTogglePriority(pokemon.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        w-full bg-white rounded-lg border border-gray-200 shadow-sm 
        hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        ${isAvailable ? 'hover:border-blue-300' : ''}
        relative overflow-hidden
      `}
    >
      {/* Priority Star - positioned for available Pokemon */}
      {showPriorityStar && isAvailable && (
        <div className="absolute top-2 left-2 z-20">
          <PriorityStarButton
            isSelected={isPrioritySelected}
            onClick={handlePriorityToggle}
          />
        </div>
      )}

      <div className="flex h-full">
        <PokemonCardContent 
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          showRank={showRank}
        />
      </div>
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
