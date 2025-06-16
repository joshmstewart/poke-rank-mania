import React from "react";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from '@/components/battle/DraggablePokemonMilestoneCard';
import { CSS } from '@dnd-kit/utilities';

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon?: any[];
}

const SortableRankedCard: React.FC<{
  pokemon: Pokemon | RankedPokemon;
  index: number;
  allRankedPokemon: (Pokemon | RankedPokemon)[];
}> = ({ pokemon, index, allRankedPokemon }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(pokemon.id),
    data: {
      type: 'ranked-pokemon',
      pokemon: pokemon,
      context: 'ranked',
    },
  });

  const style: React.CSSProperties = {
    transform: !isDragging && transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    // Keep cards visible during drag for collision detection
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    visibility: 'visible',
    display: 'block',
  };

  console.log(`[DRAG_GRID] ${pokemon.name} isDragging: ${isDragging}, opacity: ${isDragging ? 0.3 : 1}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <DraggablePokemonMilestoneCard
        pokemon={pokemon}
        index={index}
        isPending={false}
        showRank={true}
        isDraggable={true}
        isAvailable={false}
        context="ranked"
        allRankedPokemon={allRankedPokemon}
      />
    </div>
  );
};

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onMarkAsPending,
  availablePokemon = []
}) => {
  const { setNodeRef } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    },
  });
  
  const sortableItems = displayRankings.map(p => String(p.id));
  
  console.log(`[DRAG_GRID] Rendering grid with ${displayRankings.length} Pokemon, sortableItems:`, sortableItems);

  return (
    <div ref={setNodeRef} className="h-full w-full">
      <SortableContext
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {displayRankings.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400 animate-fade-in select-none opacity-75 col-span-full">
              <span className="mb-1 text-2xl">🡆</span>
              <span>Drop Pokémon here to start ranking!</span>
            </div>
          ) : (
            displayRankings.map((pokemon, index) => {
              console.log(`[DRAG_GRID] Rendering card ${pokemon.name} at index ${index}`);
              return (
                <SortableRankedCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  allRankedPokemon={displayRankings}
                />
              );
            })
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
