
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

  // DEBUG: Add extensive logging to identify the opacity issue
  console.log(`🐛 [DRAGDROP_DEBUG] Card ${pokemon.name}: isDragging=${isDragging}, transform=${transform ? 'has transform' : 'no transform'}`);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    // CRITICAL FIX: Use higher opacity for dragging state and ensure it's never 0
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    // Add important styles to prevent other CSS from overriding
    visibility: 'visible',
    display: 'block',
  };

  console.log(`🐛 [DRAGDROP_DEBUG] Card ${pokemon.name} final style:`, style);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`${isDragging ? 'drag-active' : ''}`}
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
    },
  });
  const sortableItems = displayRankings.map(p => String(p.id));

  console.log(`🐛 [DRAGDROP_DEBUG] DragDropGrid rendering with ${displayRankings.length} rankings`);

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
              console.log(`🐛 [DRAGDROP_DEBUG] Rendering card for ${pokemon.name} at index ${index}`);
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
