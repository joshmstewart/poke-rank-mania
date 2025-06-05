
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
  console.log('🎨 [GRID_FIXED] ===== DRAG DROP GRID RENDER =====');
  console.log('🎨 [GRID_FIXED] displayRankings length:', displayRankings.length);
  console.log('🎨 [GRID_FIXED] onManualReorder exists:', !!onManualReorder);

  // Create sortable items for proper drag behavior
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id.toString());
    console.log(`🎨 [GRID_FIXED] Sortable items created:`, items.slice(0, 5));
    return items;
  }, [displayRankings]);

  // Create cards with proper sortable integration
  const renderedCards = useMemo(() => {
    console.log(`🎨 [GRID_FIXED] Creating ${displayRankings.length} draggable cards`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      if (index < 3) {
        const score = 'score' in pokemon ? pokemon.score.toFixed(2) : 'N/A';
        console.log(`🎨 [GRID_FIXED] Card ${index}: ${pokemon.name} (ID: ${pokemon.id}) score: ${score}`);
      }
      
      return (
        <OptimizedDraggableCard
          key={pokemon.id.toString()}
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          context="ranked"
        />
      );
    });
  }, [displayRankings, localPendingRefinements]);

  console.log(`🎨 [GRID_FIXED] Rendering ${renderedCards.length} cards in SortableContext`);

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
});

DragDropGridMemoized.displayName = 'DragDropGridMemoized';

export default DragDropGridMemoized;
