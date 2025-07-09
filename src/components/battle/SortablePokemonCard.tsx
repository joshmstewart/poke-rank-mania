
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface SortablePokemonCardProps {
  id: string;
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending: boolean;
  allRankedPokemon: (Pokemon | RankedPokemon)[];
}

const SortablePokemonCard: React.FC<SortablePokemonCardProps> = ({
  id,
  pokemon,
  index,
  isPending,
  allRankedPokemon
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  console.log(`[SORTABLE_CARD] ${pokemon.name} (${id}):`, {
    isDragging,
    isOver,
    transform,
    hasTransform: !!transform
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full ${isDragging ? 'z-50 opacity-50' : 'z-auto'} ${isOver ? 'scale-105' : ''}`}
      {...attributes}
      {...listeners}
    >
      <DraggablePokemonMilestoneCard
        pokemon={pokemon}
        index={index}
        showRank={true}
        isDraggable={true}
        context="ranked"
        isPending={isPending}
        allRankedPokemon={allRankedPokemon}
      />
    </div>
  );
};

export default SortablePokemonCard;
