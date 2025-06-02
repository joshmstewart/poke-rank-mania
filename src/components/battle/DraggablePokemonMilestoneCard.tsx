
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
  // CRITICAL LOGGING TO TRACE PROP FLOW
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] ===== DRAGGABLE CARD RENDER =====`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] Pokemon: ${pokemon.name} (${pokemon.id})`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] showRank: ${showRank}`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] isAvailable: ${isAvailable}`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] index: ${index}`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] pokemon.isRanked: ${pokemon.isRanked}`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] pokemon.score: ${pokemon.score}`);

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

  // CRITICAL FIX: Correct the prop logic
  const shouldShowScore = !isAvailable; // Rankings should show scores, Available should not
  const shouldHideScore = isAvailable;  // Available should hide scores, Rankings should not
  
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] CALCULATED shouldShowScore: ${shouldShowScore}`);
  console.log(`🎯🎯🎯 [DRAGGABLE_CARD_CRITICAL] CALCULATED shouldHideScore: ${shouldHideScore}`);

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
        showScore={shouldShowScore}
        isRanked={pokemon.isRanked || false}
        hideScore={shouldHideScore}
      />
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
