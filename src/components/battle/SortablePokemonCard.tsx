
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
  } = useSortable({ 
    id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full ${isDragging ? 'z-50' : 'z-auto'}`}
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
