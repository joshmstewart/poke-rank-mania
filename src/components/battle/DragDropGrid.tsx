
import React from "react";
import {
  closestCenter,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonCard from "./DraggablePokemonCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  onMarkAsPending: (pokemonId: number) => void;
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending
}) => {
  console.log(`🔍 [GRID_DEBUG] DragDropGrid render with ${displayRankings.length} Pokemon`);

  return (
    <SortableContext 
      items={displayRankings.map(p => p.id)} 
      strategy={rectSortingStrategy}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {displayRankings.map((pokemon, index) => {
          const isPending = localPendingRefinements.has(pokemon.id);
          const pendingCount = pendingBattleCounts.get(pokemon.id) || 0;
          
          return (
            <DraggablePokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              isPending={isPending}
              showRank={true}
            />
          );
        })}
      </div>
    </SortableContext>
  );
};

export default DragDropGrid;
