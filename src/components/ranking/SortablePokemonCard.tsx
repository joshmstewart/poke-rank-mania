
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { Pokemon, RankedPokemon } from '@/services/pokemon';

interface SortablePokemonCardProps {
    pokemon: Pokemon | RankedPokemon;
    index: number;
    isPending: boolean;
    showRank: boolean;
    isDraggable: boolean;
    isAvailable: boolean;
    context: 'ranked' | 'available';
    allRankedPokemon: (Pokemon | RankedPokemon)[];
}

export const SortablePokemonCard: React.FC<SortablePokemonCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: String(props.pokemon.id),
    data: {
      type: 'ranked-pokemon',
      pokemon: props.pokemon,
      context: 'ranked'
    }
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DraggablePokemonMilestoneCard {...props} />
    </div>
  );
};
