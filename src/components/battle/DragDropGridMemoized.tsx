
import React, { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";

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

  console.log(`🎨 [GRID_DEBUG] Rendering ${renderedCards.length} cards in grid`);

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
    >
      {renderedCards}
    </div>
  );
});

DragDropGridMemoized.displayName = 'DragDropGridMemoized';

export default DragDropGridMemoized;
