
import React from "react";
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { UnifiedPokemonCard } from '@/components/unified/UnifiedPokemonCard';

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon?: any[];
}

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
            displayRankings.map((pokemon, index) => (
              <UnifiedPokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                context="ranked"
                showRank={true}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
