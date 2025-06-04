
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";

interface MilestoneDragProviderProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  handleEnhancedManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  stableOnLocalReorder: (newRankings: any[]) => void;
  children: React.ReactNode;
}

const MilestoneDragProvider: React.FC<MilestoneDragProviderProps> = ({
  displayRankings,
  handleEnhancedManualReorder,
  stableOnLocalReorder,
  children
}) => {
  // Drag and drop handling
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🏆 [MILESTONE_DRAG_PROVIDER] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    },
    onLocalReorder: stableOnLocalReorder
  });

  // CRITICAL: Enhanced collision detection with comprehensive logging
  const customCollisionDetection = (args: any) => {
    const collisionResults = closestCenter(args);
    
    console.log("🎯 [COLLISION_DETECTION] ===== COLLISION DETECTION TRIGGERED =====");
    console.log("🎯 [COLLISION_DETECTION] Active ID:", args.active.id);
    console.log("🎯 [COLLISION_DETECTION] Active data:", args.active.data?.current);
    console.log("🎯 [COLLISION_DETECTION] Droppable rects count:", Object.keys(args.droppableRects).length);
    console.log("🎯 [COLLISION_DETECTION] Droppable rect IDs:", Object.keys(args.droppableRects));
    console.log("🎯 [COLLISION_DETECTION] Collision results:", collisionResults);
    
    // Enhanced logging for each droppable rect with proper type checking
    Object.entries(args.droppableRects).forEach(([id, rect]) => {
      console.log(`🎯 [COLLISION_DETECTION] Droppable "${id}":`, {
        id,
        rect: rect && typeof rect === 'object' && 'left' in rect ? { 
          x: (rect as any).left, 
          y: (rect as any).top, 
          width: (rect as any).width, 
          height: (rect as any).height 
        } : 'NULL',
        disabled: rect && typeof rect === 'object' && 'disabled' in rect ? (rect as any).disabled : false
      });
    });
    
    if (collisionResults.length === 0) {
      console.log("🎯 [COLLISION_DETECTION] ❌ NO COLLISIONS DETECTED - possible causes:");
      console.log("🎯 [COLLISION_DETECTION] - Droppable areas not properly registered");
      console.log("🎯 [COLLISION_DETECTION] - CSS layout issues preventing overlap");
      console.log("🎯 [COLLISION_DETECTION] - ID mismatches between draggable and droppable");
    } else {
      console.log("🎯 [COLLISION_DETECTION] ✅ COLLISIONS FOUND:", collisionResults.map(c => c.id));
    }
    
    return collisionResults;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
};

export default MilestoneDragProvider;
