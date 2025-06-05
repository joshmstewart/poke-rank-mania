
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
  console.log('🎨 [GRID_DEBUG] ===== DRAG DROP GRID RENDER =====');
  console.log('🎨 [GRID_DEBUG] displayRankings length:', displayRankings.length);
  console.log('🎨 [GRID_DEBUG] onManualReorder exists:', !!onManualReorder);

  // Create sortable items for proper drag behavior
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => `ranking-${p.id}`);
    console.log(`🎨 [GRID_DEBUG] Sortable items created:`, items.slice(0, 5));
    console.log(`🎨 [GRID_DEBUG] Total items: ${items.length}`);
    return items;
  }, [displayRankings]);

  // Create cards with proper sortable integration
  const renderedCards = useMemo(() => {
    console.log(`🎨 [GRID_DEBUG] Creating ${displayRankings.length} draggable cards`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      if (index < 3) {
        const score = 'score' in pokemon ? pokemon.score.toFixed(2) : 'N/A';
        console.log(`🎨 [GRID_DEBUG] Card ${index}: ${pokemon.name} (ID: ${pokemon.id}) score: ${score}`);
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

  console.log(`🎨 [GRID_DEBUG] Rendering ${renderedCards.length} cards in SortableContext`);

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
