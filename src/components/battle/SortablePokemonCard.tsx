
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
}

const SortablePokemonCard: React.FC<SortablePokemonCardProps> = ({
  id,
  pokemon,
  index,
  isPending,
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
    data: { 
      index: index, 
      type: 'ranked-pokemon' 
    },
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
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
      className={`w-full ${isDragging ? 'z-50 opacity-0' : 'z-auto'}`}
      data-ranked-id={(pokemon as any).id}
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
      />
    </div>
  );
};

// Memoize: the parent re-renders on every onDragOver tick because the
// insertion-preview index lives in the DndContext owner. Without memo the
// whole grid (every heavy milestone card) re-renders on every mouse move.
export default React.memo(SortablePokemonCard, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.index === next.index &&
    prev.isPending === next.isPending &&
    (prev.pokemon as any).id === (next.pokemon as any).id &&
    (prev.pokemon as any).score === (next.pokemon as any).score
  );
});
