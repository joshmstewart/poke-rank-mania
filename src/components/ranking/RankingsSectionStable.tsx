
import React, { useCallback, useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGridMemoized from "@/components/battle/DragDropGridMemoized";
import { useDroppable } from '@dnd-kit/core';
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";

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
  console.log(`🎯 [RANKINGS_SECTION_STABLE] Rendering with ${displayRankings.length} rankings`);

  // Use stable drag handlers to prevent recreation
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    onManualReorder,
    onLocalReorder
  );

  // Memoize droppable configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-drop-zone-stable',
    data: {
      type: 'rankings-container',
      accepts: 'available-pokemon'
    }
  }), []);

  const { setNodeRef, isOver } = useDroppable(droppableConfig);
  
  // Memoize pending battle counts to prevent recreation
  const pendingBattleCounts = useMemo(() => new Map<number, number>(), []);

  // Memoized empty state content
  const emptyStateContent = useMemo(() => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <p className="text-lg mb-2">No Pokémon ranked yet</p>
        <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
        {isOver && (
          <p className="text-yellow-600 font-medium mt-2">Drop here to add to rankings!</p>
        )}
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

  // Memoized container class
  const containerClassName = useMemo(() => 
    `flex-1 overflow-y-auto p-4 transition-colors ${
      isOver ? 'bg-yellow-50 border-2 border-dashed border-yellow-400' : ''
    }`, 
    [isOver]
  );

  return (
    <div className="flex flex-col h-full">
      {headerContent}
      
      <div 
        className={containerClassName}
        ref={setNodeRef}
      >
        {displayRankings.length === 0 ? emptyStateContent : (
          <DragDropGridMemoized
            displayRankings={displayRankings}
            localPendingRefinements={pendingRefinements}
            pendingBattleCounts={pendingBattleCounts}
          />
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
