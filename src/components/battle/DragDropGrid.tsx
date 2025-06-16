
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts?: Map<number, number>;
  onMarkAsPending?: (pokemonId: number) => void;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts = new Map(),
  onMarkAsPending,
  onManualReorder,
  onLocalReorder,
  availablePokemon = []
}) => {
  // CRITICAL FIX: Proper drop zone configuration with explicit accepts
  const { setNodeRef: setDropZoneRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon'],
      context: 'rankings'
    }
  });

  console.log(`[DRAG_DROP_GRID_DEBUG] Rankings grid drop zone initialized:`, {
    id: 'rankings-grid-drop-zone',
    accepts: ['available-pokemon', 'ranked-pokemon'],
    isOver,
    rankingsCount: displayRankings.length
  });

  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
  };

  // CRITICAL FIX: Only include ranked Pokemon IDs for sortable context
  // Available Pokemon shouldn't be in the sortable context as they use draggable
  const rankedSortableIds = displayRankings.map(p => p.id.toString());

  console.log(`[DRAG_DROP_GRID_DEBUG] Ranked Sortable IDs:`, rankedSortableIds);

  const gridContent = (
    <div 
      className={`grid gap-4 mb-6 transition-all duration-200 p-4 min-h-[300px] ${
        isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg' : 'border-2 border-dashed border-transparent'
      }`}
      style={{ 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        transform: 'translateZ(0)',
        willChange: 'auto',
        // CRITICAL: Remove any containment that blocks drag detection
        overflow: 'visible',
        contain: 'none'
      }}
    >
      {displayRankings.length === 0 && (
        <div className="col-span-full flex items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <p className="text-lg mb-2">No Pokémon ranked yet</p>
            <p className="text-sm">Drag Pokémon here to start ranking</p>
          </div>
        </div>
      )}
      
      {displayRankings.map((pokemon, index) => {
        return (
          <div key={pokemon.id} style={{ overflow: 'visible', contain: 'none' }}>
            <DraggablePokemonMilestoneCard
              pokemon={pokemon}
              index={index}
              showRank={true}
              isDraggable={!!onManualReorder}
              context="ranked"
              isPending={localPendingRefinements.has(pokemon.id)}
              allRankedPokemon={displayRankings}
            />
          </div>
        );
      })}
    </div>
  );

  // CRITICAL FIX: Use only ranked Pokemon IDs in sortable context
  return (
    <div 
      ref={setDropZoneRef} 
      className="w-full" 
      style={{ 
        overflow: 'visible', 
        contain: 'none',
        position: 'relative',
        minHeight: '400px'
      }}
      data-droppable-id="rankings-grid-drop-zone"
      data-accepts="available-pokemon,ranked-pokemon"
    >
      {onManualReorder ? (
        <SortableContext 
          items={rankedSortableIds} 
          strategy={rectSortingStrategy}
        >
          {gridContent}
        </SortableContext>
      ) : (
        gridContent
      )}
    </div>
  );
};

export default DragDropGrid;
