
import React from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

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
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {displayRankings.map((pokemon, index) => {
          const isPending = localPendingRefinements.has(pokemon.id);
          const pendingCount = pendingBattleCounts.get(pokemon.id) || 0;
          
          return (
            <DraggablePokemonMilestoneCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              isPending={isPending}
              showRank={true}
              isDraggable={true}
              isAvailable={false}
            />
          );
        })}
      </div>
    </SortableContext>
  );
};

export default DragDropGrid;
