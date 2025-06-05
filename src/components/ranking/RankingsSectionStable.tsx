
import React, { useCallback, useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGridMemoized from "@/components/battle/DragDropGridMemoized";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface RankingsSectionStableProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
}

export const RankingsSectionStable: React.FC<RankingsSectionStableProps> = React.memo(({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements = new Set<number>(),
  availablePokemon = []
}) => {
  console.log(`🎯 [RANKINGS_DEBUG] Rendering with ${displayRankings.length} rankings`);
  console.log(`🎯 [RANKINGS_DEBUG] onManualReorder exists: ${!!onManualReorder}`);

  // Use stable drag handlers to prevent recreation
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    onManualReorder,
    onLocalReorder
  );

  // Create sortable items with consistent ranking- prefix
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(pokemon => `ranking-${pokemon.id}`);
    console.log(`🎯 [SORTABLE_DEBUG] SortableContext Items:`, items.slice(0, 5));
    console.log(`🎯 [SORTABLE_DEBUG] Total sortable items: ${items.length}`);
    return items;
  }, [displayRankings]);

  // CRITICAL FIX: Setup droppable for the entire rankings area with explicit collision detection
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: 'rankings-drop-zone',
    data: {
      type: 'rankings-container',
      accepts: ['available-pokemon', 'ranked-pokemon'],
      source: 'rankings-section'
    }
  });

  console.log(`🎯 [DROPPABLE_DEBUG] Rankings drop zone ID: rankings-drop-zone`);
  console.log(`🎯 [DROPPABLE_DEBUG] Drop zone accepts: available-pokemon, ranked-pokemon`);
  console.log(`🎯 [DROPPABLE_DEBUG] Drop zone isOver: ${isOver}`);

  // Memoize pending battle counts to prevent recreation
  const pendingBattleCounts = useMemo(() => new Map<number, number>(), []);

  // Memoized empty state content with droppable area
  const emptyStateContent = useMemo(() => (
    <div 
      className={`flex items-center justify-center h-full text-gray-500 border-2 border-dashed transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
      style={{ minHeight: '200px' }}
    >
      <div className="text-center">
        <p className="text-lg mb-2">No Pokémon ranked yet</p>
        <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
        {isOver && <p className="text-blue-600 font-medium mt-2">Drop here to add to rankings</p>}
      </div>
    </div>
  ), [isOver]);

  // Memoized header content
  const headerContent = useMemo(() => (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Rankings</h2>
        <div className="text-sm text-gray-500 font-medium">
          {displayRankings.length} Pokémon ranked
        </div>
      </div>
    </div>
  ), [displayRankings.length]);

  return (
    <div className="flex flex-col h-full">
      {headerContent}
      
      <div 
        ref={setDroppableRef} 
        className={`flex-1 overflow-y-auto p-4 transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        {displayRankings.length === 0 ? emptyStateContent : (
          <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
            <div 
              className={`transition-colors ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg p-2' : ''}`}
            >
              <DragDropGridMemoized
                displayRankings={displayRankings}
                localPendingRefinements={pendingRefinements}
                pendingBattleCounts={pendingBattleCounts}
                onManualReorder={stableOnManualReorder}
                onLocalReorder={stableOnLocalReorder}
              />
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for stable rendering
  return (
    prevProps.displayRankings.length === nextProps.displayRankings.length &&
    prevProps.pendingRefinements.size === nextProps.pendingRefinements.size &&
    prevProps.displayRankings.every((prev, index) => 
      prev.id === nextProps.displayRankings[index]?.id
    )
  );
});

RankingsSectionStable.displayName = 'RankingsSectionStable';
