
import React, { useMemo, useCallback } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  useDndContext
} from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = React.memo(({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = []
}) => {
  console.log(`🎯 [DRAG_DROP_GRID] Rendering with ${displayRankings.length} ranked Pokemon`);

  const dndContext = useDndContext();
  const { active } = dndContext;
  
  const activePokemon = useMemo(() => {
    if (!active) return null;
    
    const activeId = typeof active.id === 'string' ? parseInt(active.id.replace('sortable-ranking-', '')) : active.id;
    return displayRankings.find(p => p.id === activeId) || null;
  }, [active, displayRankings]);

  // CRITICAL: Create sortable items with the exact format expected by SortableRankedCard
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => `sortable-ranking-${p.id}`);
    console.log(`🎯 [SORTABLE_ITEMS] Created ${items.length} sortable items:`, items.slice(0, 5));
    return items;
  }, [displayRankings]);

  const renderedCards = useMemo(() => {
    console.log(`🎯 [RENDER_CARDS] Creating ${displayRankings.length} ranked cards`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      console.log(`🎯 [CARD_RENDER] Rendering ranked card for ${pokemon.name} (ID: ${pokemon.id}) at index ${index}`);
      
      return (
        <OptimizedDraggableCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          context="ranked"
        />
      );
    });
  }, [displayRankings, localPendingRefinements]);

  console.log(`🎯 [DRAG_DROP_GRID] Setting up SortableContext with ${sortableItems.length} items`);

  return (
    <div>
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div 
          className="grid gap-4" 
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
        >
          {renderedCards}
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [MEMO_CHECK] Rankings length changed - allowing re-render`);
    return false;
  }
  
  for (let i = 0; i < Math.min(5, prevProps.displayRankings.length); i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id) {
      console.log(`🎯 [MEMO_CHECK] Pokemon order changed - allowing re-render`);
      return false;
    }
  }
  
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [MEMO_CHECK] Pending refinements changed - allowing re-render`);
    return false;
  }
  
  return true;
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
