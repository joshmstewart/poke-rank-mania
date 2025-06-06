
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
  const itemHeight = viewMode === 'grid' ? 160 : 80;
  const itemsPerRow = viewMode === 'grid' ? 4 : 1;
  
  // Filter out header items and only work with Pokemon
  const pokemonItems = useMemo(() => {
    return items.filter(item => item.type !== 'header' && item.id);
  }, [items]);
  
  // Convert items to rows for grid view
  const rows = useMemo(() => {
    if (viewMode === 'list') return pokemonItems;
    
    const rows = [];
    for (let i = 0; i < pokemonItems.length; i += itemsPerRow) {
      rows.push(pokemonItems.slice(i, i + itemsPerRow));
    }
    return rows;
  }, [pokemonItems, itemsPerRow, viewMode]);

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

  // If we have no Pokemon items, show a message
  if (pokemonItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No Pokémon available</p>
      </div>
    );
  }

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
                Array.isArray(row) ? row.map((pokemon: any, colIndex: number) => (
                  <DraggablePokemonMilestoneCard
                    key={`available-${pokemon.id}`}
                    pokemon={pokemon}
                    index={visibleItems.startIndex * itemsPerRow + rowIndex * itemsPerRow + colIndex}
                    isPending={false}
                    showRank={pokemon.isRanked}
                    isDraggable={true}
                    isAvailable={true}
                    context="available"
                  />
                )) : (
                  <DraggablePokemonMilestoneCard
                    key={`available-${row.id}`}
                    pokemon={row}
                    index={visibleItems.startIndex * itemsPerRow + rowIndex}
                    isPending={false}
                    showRank={row.isRanked}
                    isDraggable={true}
                    isAvailable={true}
                    context="available"
                  />
                )
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {visibleItems.items.map((pokemon: any, index: number) => (
                <DraggablePokemonMilestoneCard
                  key={`available-${pokemon.id}`}
                  pokemon={pokemon}
                  index={visibleItems.startIndex + index}
                  isPending={false}
                  showRank={pokemon.isRanked}
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
