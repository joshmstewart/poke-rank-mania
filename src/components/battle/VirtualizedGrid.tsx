
import React, { useMemo } from 'react';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from './DraggablePokemonMilestoneCard';

interface VirtualizedGridProps {
  items: (Pokemon | RankedPokemon)[];
  columnCount: number;
  itemWidth: number;
  itemHeight: number;
  containerHeight: number;
  containerWidth: number;
  context: 'available' | 'ranked';
  localPendingRefinements?: Set<number>;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
}

const VirtualizedGrid: React.FC<VirtualizedGridProps> = React.memo(({
  items,
  columnCount,
  itemWidth,
  itemHeight,
  containerHeight,
  containerWidth,
  context,
  localPendingRefinements = new Set<number>(),
  onManualReorder
}) => {
  console.log(`🔥 [VIRTUALIZED_GRID] Rendering ${items.length} items in ${context} context`);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columnCount}, minmax(${itemWidth}px, 1fr))`,
    gap: '8px',
    padding: '8px',
    height: `${containerHeight}px`,
    width: `${containerWidth}px`,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const
  }), [columnCount, itemWidth, containerHeight, containerWidth]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No Pokémon {context === 'ranked' ? 'ranked' : 'available'} yet</p>
          {context === 'ranked' && (
            <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {items.map((pokemon, index) => {
        const isPending = localPendingRefinements.has(pokemon.id);

        return (
          <div key={pokemon.id} className="p-2">
            <DraggablePokemonMilestoneCard
              pokemon={pokemon}
              index={index}
              isPending={isPending}
              showRank={context === 'ranked'}
              isDraggable={true}
              isAvailable={context === 'available'}
              context={context}
            />
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.items.length === nextProps.items.length &&
    prevProps.columnCount === nextProps.columnCount &&
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.containerWidth === nextProps.containerWidth &&
    prevProps.context === nextProps.context &&
    prevProps.localPendingRefinements.size === nextProps.localPendingRefinements.size
  );
});

VirtualizedGrid.displayName = 'VirtualizedGrid';

export default VirtualizedGrid;
