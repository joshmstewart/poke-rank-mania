
import React, { useMemo } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DragDropGridMemoizedProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
}

const DragDropGridMemoized: React.FC<DragDropGridMemoizedProps> = React.memo(({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts
}) => {
  console.log(`🎯 [MEMOIZED_GRID] Rendering with ${displayRankings.length} items`);

  // Memoize sortable items to prevent recreation on every render
  const sortableItems = useMemo(() => {
    return displayRankings.map(p => p.id);
  }, [displayRankings]);

  // Set up droppable zone with memoized configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone-memoized',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []);

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  // Memoize the grid style to prevent recreation
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
  }), []);

  // Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  return (
    <div 
      ref={setNodeRef}
      className={gridClassName}
    >
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={gridStyle}>
          {displayRankings.map((pokemon, index) => {
            const isPending = localPendingRefinements.has(pokemon.id);
            
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
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    return false;
  }
  
  // Check if any Pokemon in the rankings actually changed
  for (let i = 0; i < prevProps.displayRankings.length; i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id || prev.name !== next.name) {
      return false;
    }
  }
  
  // Check pending refinements
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    return false;
  }
  
  // If all checks pass, props are effectively the same
  return true;
});

DragDropGridMemoized.displayName = 'DragDropGridMemoized';

export default DragDropGridMemoized;
