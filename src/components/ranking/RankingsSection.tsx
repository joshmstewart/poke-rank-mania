
import React, { useCallback, useMemo } from "react";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
import { useRenderTracker } from "@/hooks/battle/useRenderTracker";

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = React.memo(({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements = new Set<number>(),
  availablePokemon = []
}) => {
  // Track renders for performance debugging
  useRenderTracker('RankingsSection', { 
    rankingsCount: displayRankings.length,
    hasManualReorder: !!onManualReorder 
  });

  console.log(`🚨 [RANKINGS_SECTION] Rendering with ${displayRankings.length} rankings`);

  // Memoize empty state content
  const emptyStateContent = useMemo(() => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <p className="text-lg mb-2">No Pokémon ranked yet</p>
        <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
      </div>
    </div>
  ), []);

  // Sortable item ids must match the ids used by OptimizedDraggableCard
  const sortableItems = useMemo(
    () => displayRankings.map((p) => `ranking-${p.id}`),
    [displayRankings]
  );

  // Create individual droppable slot component with Pokémon-based IDs
  const DroppableRankingSlot: React.FC<{ index: number; pokemon?: Pokemon | RankedPokemon }> = ({ index, pokemon }) => {
    // CRITICAL FIX: Use Pokémon ID for droppable slots, fall back to index for empty slots
    const droppableId = pokemon ? `ranking-${pokemon.id}` : `ranking-position-${index}`;
    const { setNodeRef, isOver } = useDroppable({ 
      id: droppableId,
      data: {
        type: 'ranking-position',
        index: index,
        pokemonId: pokemon?.id,
        accepts: ['available-pokemon']
      }
    });

    console.log(`🔍 [DROPPABLE] Slot ${index} (${droppableId}): isOver=${isOver}, pokemon=${pokemon?.name || 'Empty'}`);

    return (
      <div 
        ref={setNodeRef}
        className={`
          relative p-2 border-2 border-dashed rounded-lg min-h-[180px] 
          transition-all duration-200
          ${isOver 
            ? 'border-green-500 bg-green-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        {pokemon ? (
          <OptimizedDraggableCard
            pokemon={pokemon}
            index={index}
            showRank={true}
            isDraggable={true}
            context="ranked"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-sm">Drop here</p>
              <p className="text-xs">Position #{index + 1}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Rankings</h2>
          <div className="text-sm text-gray-500 font-medium">
            {displayRankings.length} Pokémon ranked
          </div>
        </div>
      </div>
      
      {/* Rankings Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayRankings.length === 0 ? (
          emptyStateContent
        ) : (
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
            >
              {displayRankings.map((pokemon, index) => (
                <DroppableRankingSlot
                  key={`slot-${index}`}
                  index={index}
                  pokemon={pokemon}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
});

RankingsSection.displayName = 'RankingsSection';
