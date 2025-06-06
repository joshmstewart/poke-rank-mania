
import React, { useMemo } from 'react';
import { useVirtualScrolling } from '@/hooks/pokemon/useVirtualScrolling';
import DraggablePokemonMilestoneCard from '@/components/battle/DraggablePokemonMilestoneCard';

interface VirtualPokemonGridProps {
  items: any[];
  viewMode: 'list' | 'grid';
  containerHeight: number;
}

export const VirtualPokemonGrid: React.FC<VirtualPokemonGridProps> = ({
  items,
  viewMode,
  containerHeight
}) => {
  const itemHeight = viewMode === 'grid' ? 160 : 80; // Estimated heights
  const itemsPerRow = viewMode === 'grid' ? 4 : 1;
  
  // Convert items to rows for grid view
  const rows = useMemo(() => {
    if (viewMode === 'list') return items;
    
    const rows = [];
    for (let i = 0; i < items.length; i += itemsPerRow) {
      rows.push(items.slice(i, i + itemsPerRow));
    }
    return rows;
  }, [items, itemsPerRow, viewMode]);

  const {
    visibleItems,
    handleScroll,
    totalHeight,
    offsetY
  } = useVirtualScrolling({
    items: rows,
    itemHeight,
    containerHeight,
    overscan: 3
  });

  return (
    <div 
      className="flex-1 overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-2 p-2">
              {visibleItems.items.map((row, rowIndex) => 
                row.map((pokemon: any, colIndex: number) => (
                  <DraggablePokemonMilestoneCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    index={visibleItems.startIndex * itemsPerRow + rowIndex * itemsPerRow + colIndex}
                    isPending={false}
                    showRank={false}
                    isDraggable={true}
                    isAvailable={true}
                    context="available"
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {visibleItems.items.map((pokemon: any, index: number) => (
                <DraggablePokemonMilestoneCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={visibleItems.startIndex + index}
                  isPending={false}
                  showRank={false}
                  isDraggable={true}
                  isAvailable={true}
                  context="available"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
