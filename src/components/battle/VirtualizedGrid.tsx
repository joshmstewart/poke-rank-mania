
import React, { useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
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

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: (Pokemon | RankedPokemon)[];
    columnCount: number;
    context: 'available' | 'ranked';
    localPendingRefinements: Set<number>;
    onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  };
}

const GridCell = React.memo<CellProps>(({ columnIndex, rowIndex, style, data }) => {
  const { items, columnCount, context, localPendingRefinements, onManualReorder } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= items.length) {
    return <div style={style} />;
  }

  const pokemon = items[index];
  const isPending = localPendingRefinements.has(pokemon.id);

  return (
    <div style={style} className="p-2">
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
}, (prevProps, nextProps) => {
  const prevIndex = prevProps.rowIndex * prevProps.data.columnCount + prevProps.columnIndex;
  const nextIndex = nextProps.rowIndex * nextProps.data.columnCount + nextProps.columnIndex;
  
  const prevPokemon = prevProps.data.items[prevIndex];
  const nextPokemon = nextProps.data.items[nextIndex];
  
  if (!prevPokemon && !nextPokemon) return true;
  if (!prevPokemon || !nextPokemon) return false;
  
  return (
    prevPokemon.id === nextPokemon.id &&
    prevProps.data.localPendingRefinements.has(prevPokemon.id) === 
    nextProps.data.localPendingRefinements.has(nextPokemon.id)
  );
});

GridCell.displayName = 'GridCell';

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

  const rowCount = Math.ceil(items.length / columnCount);

  const itemData = useMemo(() => ({
    items,
    columnCount,
    context,
    localPendingRefinements,
    onManualReorder
  }), [items, columnCount, context, localPendingRefinements, onManualReorder]);

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
    <Grid
      height={containerHeight}
      width={containerWidth}
      columnCount={columnCount}
      columnWidth={itemWidth}
      rowCount={rowCount}
      rowHeight={itemHeight}
      itemData={itemData}
      overscanRowCount={2}
      overscanColumnCount={1}
    >
      {GridCell}
    </Grid>
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
