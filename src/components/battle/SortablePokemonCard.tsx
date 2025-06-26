
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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full"
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
