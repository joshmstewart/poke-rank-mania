
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
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = []
}) => {
  // Only include ranked Pokemon IDs for sortable context - remove collision placeholders and available Pokemon
  const sortableItems = displayRankings.map(p => p.id);

  console.log(`🔧 [DRAG_FIX] DragDropGrid sortable items: ${sortableItems.join(', ')}`);

  return (
    <div className="transition-colors">
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
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
                context="ranked"
                allRankedPokemon={displayRankings}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
