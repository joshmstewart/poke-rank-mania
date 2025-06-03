
import React, { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface DragDropGridMemoizedProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
}

const DragDropGridMemoized: React.FC<DragDropGridMemoizedProps> = React.memo(({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder
}) => {
  // CRITICAL DEBUG: Log what the grid receives
  console.log('🎨 [GRID_VISUAL_DEBUG] ===== DRAG DROP GRID RENDER =====');
  console.log('🎨 [GRID_VISUAL_DEBUG] displayRankings length:', displayRankings.length);
  console.log('🎨 [GRID_VISUAL_DEBUG] First 5 rankings received:', displayRankings.slice(0, 5).map((p, i) => {
    const score = 'score' in p ? p.score.toFixed(2) : 'N/A';
    return `${i+1}. ${p.name} (${score})`;
  }));
  console.log('🎨 [GRID_VISUAL_DEBUG] Grid render timestamp:', Date.now());
  console.log('🎨 [GRID_VISUAL_DEBUG] onManualReorder exists:', !!onManualReorder);
  console.log('🎨 [GRID_VISUAL_DEBUG] onLocalReorder exists:', !!onLocalReorder);

  // Stable items array for SortableContext
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id);
    console.log(`🎨 [GRID_VISUAL_DEBUG] Creating sortable items - count: ${items.length}`);
    console.log('🎨 [GRID_VISUAL_DEBUG] Sortable items IDs:', items.slice(0, 10));
    return items;
  }, [displayRankings]);

  // REDUCED LOGGING: Create cards for all items with detailed logging for first few
  const renderedCards = useMemo(() => {
    console.log(`🎨 [GRID_VISUAL_DEBUG] Creating cards for ${displayRankings.length} pokemon`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      // Enhanced logging for first 5 items
      if (index < 5) {
        const score = 'score' in pokemon ? pokemon.score.toFixed(2) : 'N/A';
        console.log(`🎨 [GRID_VISUAL_DEBUG] Creating card ${index}: ${pokemon.name} (ID: ${pokemon.id}) score: ${score}`);
      }
      
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

  console.log(`🎨 [GRID_VISUAL_DEBUG] Grid render complete - ${renderedCards.length} cards created`);

  return (
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
  );
}, (prevProps, nextProps) => {
  const isEqual = (
    prevProps.displayRankings.length === nextProps.displayRankings.length &&
    prevProps.localPendingRefinements.size === nextProps.localPendingRefinements.size &&
    // Quick check of first few items for order changes
    prevProps.displayRankings.slice(0, 5).every((p, i) => p.id === nextProps.displayRankings[i]?.id)
  );
  
  console.log(`🎨 [GRID_MEMO_DEBUG] Grid memo comparison: ${isEqual ? 'PREVENTING' : 'ALLOWING'} re-render`);
  
  if (!isEqual) {
    console.log('🎨 [GRID_MEMO_DEBUG] Re-render reason:');
    console.log('🎨 [GRID_MEMO_DEBUG] - Length changed:', prevProps.displayRankings.length !== nextProps.displayRankings.length);
    console.log('🎨 [GRID_MEMO_DEBUG] - Pending changed:', prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size);
    console.log('🎨 [GRID_MEMO_DEBUG] - Order changed:', !prevProps.displayRankings.slice(0, 5).every((p, i) => p.id === nextProps.displayRankings[i]?.id));
  }
  
  return isEqual;
});

DragDropGridMemoized.displayName = 'DragDropGridMemoized';

export default DragDropGridMemoized;
