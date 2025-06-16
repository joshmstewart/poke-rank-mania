
import React from "react";
import { useVirtualScrolling } from "@/hooks/pokemon/useVirtualScrolling";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { Card } from "@/components/ui/card";

interface LazyPokemonGridProps {
  items: any[];
  showGenerationHeaders?: boolean;
  isRankingArea?: boolean;
  onItemAction?: (item: any) => void;
}

export const LazyPokemonGrid: React.FC<LazyPokemonGridProps> = ({
  items,
  showGenerationHeaders = false,
  isRankingArea = false,
  onItemAction
}) => {
  const containerHeight = 600; // Adjust based on your layout
  const itemHeight = 200; // Approximate height of each Pokemon card

  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualScrolling({
    items,
    itemHeight,
    containerHeight
  });

  const rankedList = React.useMemo(
    () => items.filter(i => i.type === 'pokemon').map(i => i.data),
    [items]
  );

  return (
    <div
      ref={scrollElementRef}
      className="h-[600px] overflow-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            position: 'relative'
          }}
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {visibleItems.map((item, index) => {
              if (!item) return null;

              // Render generation header
              if (item.type === 'header') {
                return (
                  <div key={`gen-${item.generationId}`} className="col-span-full">
                    <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                      <h3 className="font-bold text-lg text-blue-800">
                        Generation {item.generationId}
                      </h3>
                      <p className="text-sm text-blue-600">{item.data.name}</p>
                    </Card>
                  </div>
                );
              }

              // Render Pokemon
              if (item.type === 'pokemon' && item.data) {
                const pokemon = item.data;
                
                return (
                  <DraggablePokemonMilestoneCard
                    key={`pokemon-${pokemon.id}-${item.virtualIndex}`}
                    pokemon={pokemon}
                    index={item.actualIndex}
                    isPending={false}
                    showRank={isRankingArea}
                    isDraggable={true}
                    isAvailable={!isRankingArea}
                    context={isRankingArea ? "ranked" : "available"}
                    allRankedPokemon={isRankingArea ? rankedList : []}
                  />
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
