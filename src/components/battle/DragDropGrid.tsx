
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
  // Set up drop zone for rankings grid - FIXED collision detection
  const { setNodeRef: setDropZoneRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon'] // This MUST match what's being dragged
    }
  });

  console.log(`[DRAG_DROP_ZONE] Rankings grid drop zone initialized:`, {
    id: 'rankings-grid-drop-zone',
    setNodeRef: !!setDropZoneRef,
    isOver,
    accepts: ['available-pokemon', 'ranked-pokemon'],
    collision_detection: 'FIXED'
  });

  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
  };

  const gridContent = (
    <div 
      className={`grid gap-4 mb-6 transition-colors duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-2' : ''
      }`}
      style={{ 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        transform: 'translateZ(0)',
        willChange: 'auto',
        minHeight: displayRankings.length === 0 ? '200px' : 'auto',
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
          <DraggablePokemonMilestoneCard
            key={pokemon.id}
            pokemon={pokemon}
            index={index}
            showRank={true}
            isDraggable={!!onManualReorder}
            context="ranked"
            isPending={localPendingRefinements.has(pokemon.id)}
            allRankedPokemon={displayRankings}
          />
        );
      })}
    </div>
  );

  // Only wrap in SortableContext if we have a manual reorder handler
  if (onManualReorder) {
    return (
      <div ref={setDropZoneRef} className="w-full" style={{ overflow: 'visible', contain: 'none' }}>
        <SortableContext 
          items={displayRankings.map(p => p.id.toString())} 
          strategy={rectSortingStrategy}
        >
          {gridContent}
        </SortableContext>
      </div>
    );
  }

  return <div ref={setDropZoneRef} className="w-full" style={{ overflow: 'visible', contain: 'none' }}>{gridContent}</div>;
};

export default DragDropGrid;
