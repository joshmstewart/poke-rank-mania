
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UnifiedPokemonCard } from "@/components/ranking/UnifiedPokemonCard";

interface DraggablePokemonMilestoneCardProps {
  pokemon: any;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({
  pokemon,
  index,
  isPending = false,
  showRank = false,
  isDraggable = true,
  isAvailable = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: pokemon.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDraggable ? listeners : {})}
      className={`${isDragging ? 'opacity-50 z-50' : ''} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <UnifiedPokemonCard
        pokemon={pokemon}
        rank={showRank ? index + 1 : undefined}
        showRank={showRank}
        showScore={!isAvailable}
        isRanked={pokemon.isRanked || false}
        hideScore={isAvailable}
      />
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
