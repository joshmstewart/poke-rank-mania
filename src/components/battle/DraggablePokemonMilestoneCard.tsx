
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
  isAvailable?: boolean; // This tells us which section we're in
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

  // Different props based on which section we're in
  const cardProps = isAvailable ? {
    // Available Pokemon section - hide score, show rank indicator for ranked Pokemon
    showScore: false,
    hideScore: true,
    isRanked: pokemon.isRanked || false,
    showRank: false // Don't show numbered rank, just the crown indicator
  } : {
    // Rankings section - show numbered rank, show score
    showScore: true,
    hideScore: false,
    isRanked: false,
    showRank: true,
    rank: index + 1
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
        {...cardProps}
      />
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
