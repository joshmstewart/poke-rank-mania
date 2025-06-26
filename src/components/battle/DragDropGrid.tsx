
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
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

// Individual drop zone component for precise positioning
const DropZone: React.FC<{
  id: string;
  index: number;
  isLast?: boolean;
  className?: string;
}> = ({ id, index, isLast = false, className = "" }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'ranking-position',
      index,
      position: isLast ? 'end' : 'before'
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`${isOver ? 'bg-blue-100 border-2 border-dashed border-blue-400' : 'border-2 border-dashed border-transparent'} 
        transition-all duration-200 ${className}`}
      style={{ minHeight: isLast ? '60px' : '20px' }}
      data-drop-zone-id={id}
    >
      {isOver && (
        <div className="flex items-center justify-center h-full text-blue-600 text-sm font-medium">
          Drop here to {isLast ? 'add to end' : `insert at position ${index + 1}`}
        </div>
      )}
    </div>
  );
};

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts = new Map(),
  onMarkAsPending,
  onManualReorder,
  onLocalReorder,
  availablePokemon = []
}) => {
  console.log(`[DRAG_DROP_GRID_PURE] Rendering with ${displayRankings.length} ranked Pokemon`);

  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
  };

  if (displayRankings.length === 0) {
    return (
      <div className="w-full min-h-[400px]">
        <DropZone
          id="empty-rankings-drop"
          index={0}
          isLast={true}
          className="flex items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[400px]">
      {/* Drop zone before first item */}
      <DropZone id="drop-before-0" index={0} />
      
      {/* Grid layout matching Available Pokemon section */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {displayRankings.map((pokemon, index) => (
          <div key={pokemon.id} className="w-full">
            <DraggablePokemonMilestoneCard
              pokemon={pokemon}
              index={index}
              showRank={true}
              isDraggable={!!onManualReorder}
              context="ranked"
              isPending={localPendingRefinements.has(pokemon.id)}
              allRankedPokemon={displayRankings}
            />
            
            {/* Drop zone after this item - positioned between grid items */}
            <DropZone 
              id={`drop-after-${index}`} 
              index={index + 1}
              className="mt-1"
            />
          </div>
        ))}
      </div>
      
      {/* Final drop zone at the end */}
      <DropZone 
        id={`drop-after-${displayRankings.length - 1}`} 
        index={displayRankings.length}
        isLast={true}
      />
    </div>
  );
};

export default DragDropGrid;
