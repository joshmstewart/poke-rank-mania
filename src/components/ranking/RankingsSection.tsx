
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

  // Create individual droppable slot component with enhanced debugging
  const DroppableRankingSlot: React.FC<{ index: number; pokemon?: Pokemon | RankedPokemon }> = ({ index, pokemon }) => {
    const droppableId = `ranking-${index}`;
    const { setNodeRef, isOver } = useDroppable({ 
      id: droppableId,
      data: {
        type: 'ranking-position',
        index: index,
        accepts: ['available-pokemon']
      }
    });

    // Enhanced logging for each droppable
    console.log(`🔍 [DROPPABLE_DETAILED] Slot ${index}:`);
    console.log(`🔍 [DROPPABLE_DETAILED] - ID: ${droppableId}`);
    console.log(`🔍 [DROPPABLE_DETAILED] - Has setNodeRef: ${!!setNodeRef}`);
    console.log(`🔍 [DROPPABLE_DETAILED] - isOver: ${isOver}`);
    console.log(`🔍 [DROPPABLE_DETAILED] - Pokemon: ${pokemon?.name || 'Empty'}`);
    console.log(`[DROPPABLE_INIT] Initialized droppable: ${droppableId}, isOver: ${isOver}`);

    // Enhanced collision detection logging
    React.useEffect(() => {
      if (isOver) {
        console.log(`🎯 [COLLISION_DETECTED] Slot ${index} (${droppableId}) is being hovered over!`);
        console.log(`🎯 [COLLISION_DETECTED] Pokemon in slot: ${pokemon?.name || 'Empty'}`);
      }
    }, [isOver, index, droppableId, pokemon?.name]);

    return (
      <div 
        ref={setNodeRef} 
        className={`droppable-slot transition-all duration-200 border-2 ${
          isOver 
            ? "bg-green-200 border-green-400 shadow-lg" 
            : "bg-white border-gray-300"
        }`}
        style={{ 
          minWidth: '140px', 
          minHeight: '200px',
          margin: '4px',
          borderRadius: '8px'
        }}
        onMouseEnter={() => {
          console.log(`🖱️ [MOUSE_ENTER] Slot ${index} mouse enter`);
        }}
        onMouseLeave={() => {
          console.log(`🖱️ [MOUSE_LEAVE] Slot ${index} mouse leave`);
        }}
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
            <div className="text-center">
              <span className="text-sm font-medium">Empty Slot {index + 1}</span>
              <div className="text-xs mt-1">Drop here</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Log the creation of all droppable slots
  console.log(`🔧 [DROPPABLE_CREATION] Creating ${displayRankings.length} droppable slots`);
  for (let i = 0; i < displayRankings.length; i++) {
    console.log(`🔧 [DROPPABLE_CREATION] Slot ${i}: ranking-${i} with pokemon: ${displayRankings[i]?.name || 'Empty'}`);
  }

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
            {displayRankings.map((pokemon, index) => {
              console.log(`🎯 [SLOT_RENDER] Rendering slot ${index} with pokemon: ${pokemon?.name || 'Empty'}`);
              return (
                <DroppableRankingSlot 
                  key={`slot-${index}`} 
                  index={index} 
                  pokemon={pokemon} 
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

RankingsSection.displayName = 'RankingsSection';
