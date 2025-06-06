
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";

interface DraggableMilestoneGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
}

const DraggableMilestoneGrid: React.FC<DraggableMilestoneGridProps> = ({
  displayRankings,
  localPendingRefinements,
  onManualReorder
}) => {
  const [activePokemon, setActivePokemon] = React.useState<Pokemon | RankedPokemon | null>(null);

  console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] Rendering with ${displayRankings.length} Pokemon`);
  console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] onManualReorder provided: ${!!onManualReorder}`);

  // Only use drag and drop if onManualReorder is provided
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: onManualReorder || (() => {
      console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] No manual reorder handler - drag disabled`);
    }),
    onLocalReorder: () => {} // Not needed for milestone grid
  });

  const handleDragStart = (event: any) => {
    const activePokemon = displayRankings.find(p => p.id === event.active.id);
    setActivePokemon(activePokemon || null);
  };

  const handleDragEndWithCleanup = (event: any) => {
    handleDragEnd(event);
    setActivePokemon(null);
  };

  // Hardware accelerated drop animation for smoother transitions
  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
    // Add hardware acceleration to drop animation
    keyframes({ transform }: any) {
      return [
        { opacity: 1, transform: transform.initial },
        { opacity: 0.8, transform: `${transform.initial} scale(1.05)` },
        { opacity: 1, transform: transform.final },
      ];
    },
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  };

  const content = (
    <div 
      className="grid gap-4 mb-6" 
      style={{ 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        // Hardware acceleration for the grid container
        transform: 'translateZ(0)',
        willChange: 'auto'
      }}
    >
      {displayRankings.map((pokemon, index) => (
        <DraggablePokemonMilestoneCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          showRank={true}
          isDraggable={!!onManualReorder}
          context="ranked"
          isPending={localPendingRefinements.has(pokemon.id)}
        />
      ))}
    </div>
  );

  // Only wrap in DndContext if we have a manual reorder handler
  if (onManualReorder) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEndWithCleanup}
      >
        <SortableContext 
          items={displayRankings.map(p => p.id.toString())} 
          strategy={rectSortingStrategy}
        >
          {content}
        </SortableContext>
        
        {/* Lightweight drag overlay - only image and background color */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activePokemon ? (
            <div 
              className={`${getPokemonBackgroundColor(activePokemon)} rounded-lg w-35 h-35 flex items-center justify-center rotate-2 scale-105 shadow-2xl border-2 border-blue-400`}
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}
            >
              <img 
                src={activePokemon.image} 
                alt={activePokemon.name}
                className="w-20 h-20 object-contain"
                style={{ 
                  transform: 'translateZ(0)',
                  willChange: 'auto'
                }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return content;
};

export default DraggableMilestoneGrid;
