
import React, { useCallback, useMemo } from "react";
import { useDroppable } from '@dnd-kit/core';
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

  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] ===== RENDERING RANKINGS SECTION =====`);
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Display rankings count: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Available Pokemon for collision: ${availablePokemon.length}`);

  // Memoize empty state content
  const emptyStateContent = useMemo(() => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <p className="text-lg mb-2">No Pokémon ranked yet</p>
        <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
      </div>
    </div>
  ), []);

  // Create individual droppable slot component
  const DroppableRankingSlot: React.FC<{ index: number; pokemon?: Pokemon | RankedPokemon }> = ({ index, pokemon }) => {
    const { setNodeRef, isOver } = useDroppable({ 
      id: `ranking-${index}`,
      data: {
        type: 'ranking-position',
        index: index,
        accepts: ['available-pokemon']
      }
    });

    console.log(`[DROPPABLE_INIT] Initialized droppable: ranking-${index}, isOver: ${isOver}`);

    return (
      <div 
        ref={setNodeRef} 
        className={`droppable-slot transition-colors ${isOver ? "bg-green-200 border-2 border-green-400" : "bg-white"}`}
        style={{ minWidth: '140px', minHeight: '200px' }}
      >
        {pokemon ? (
          <OptimizedDraggableCard
            pokemon={pokemon}
            index={index}
            isPending={pendingRefinements.has(pokemon.id)}
            context="ranked"
          />
        ) : (
          <div className="empty-slot flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
            <span className="text-sm">Empty Slot {index + 1}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Streamlined Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Rankings</h2>
          <div className="text-sm text-gray-500 font-medium">
            {displayRankings.length} Pokémon ranked
          </div>
        </div>
      </div>
      
      {/* Rankings Grid - Each position is a separate droppable */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayRankings.length === 0 ? emptyStateContent : (
          <div 
            className="grid gap-4" 
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
          >
            {displayRankings.map((pokemon, index) => (
              <DroppableRankingSlot key={index} index={index} pokemon={pokemon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

RankingsSection.displayName = 'RankingsSection';
