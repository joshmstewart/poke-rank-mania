
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
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
  console.log(`🔥 [MILESTONE_DRAG_PROVIDER] Provider initializing with ${displayRankings.length} rankings`);

  // CRITICAL FIX: Explicit sensors with proper constraints
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  console.log(`🔥 [MILESTONE_DRAG_PROVIDER] Sensors initialized:`, {
    mouseSensor: !!sensors,
    sensorsCount: sensors.length
  });

  // Drag and drop handling
  const { handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🏆 [MILESTONE_DRAG_PROVIDER] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    },
    onLocalReorder: stableOnLocalReorder
  });

  // CRITICAL: Enhanced collision detection with comprehensive logging
  const customCollisionDetection = (args: any) => {
    console.log("🎯🎯🎯 [COLLISION_ARGS] ===== FULL COLLISION ARGS =====", args);
    console.log("🎯🎯🎯 [COLLISION_ARGS] Active:", args.active);
    console.log("🎯🎯🎯 [COLLISION_ARGS] DroppableRects:", args.droppableRects);
    console.log("🎯🎯🎯 [COLLISION_ARGS] DroppableContainers:", args.droppableContainers);
    
    const collisionResults = closestCenter(args);
    
    console.log("🎯🎯🎯 [COLLISION_RESULTS] ===== COLLISION RESULTS =====", collisionResults);
    
    if (collisionResults.length === 0) {
      console.log("🎯🎯🎯 [COLLISION_FAILURE] ❌ NO COLLISIONS DETECTED");
      console.log("🎯🎯🎯 [COLLISION_FAILURE] - Check if droppable areas are registered");
      console.log("🎯🎯🎯 [COLLISION_FAILURE] - Check CSS positioning and layout");
      console.log("🎯🎯🎯 [COLLISION_FAILURE] - Check if draggable overlaps droppable areas");
    } else {
      console.log("🎯🎯🎯 [COLLISION_SUCCESS] ✅ COLLISIONS FOUND:", collisionResults.map(c => c.id));
    }
    
    return collisionResults;
  };

  const handleDragStart = (event: any) => {
    console.log("🚀🚀🚀 [DRAG_START_MILESTONE] ===== DRAG START IN MILESTONE PROVIDER =====");
    console.log("🚀🚀🚀 [DRAG_START_MILESTONE] Active ID:", event.active.id);
    console.log("🚀🚀🚀 [DRAG_START_MILESTONE] Active data:", event.active.data?.current);
  };

  const handleDragOver = (event: any) => {
    if (event.over) {
      console.log("🔄🔄🔄 [DRAG_OVER_MILESTONE] ===== DRAG OVER DETECTED =====");
      console.log("🔄🔄🔄 [DRAG_OVER_MILESTONE] Over ID:", event.over.id);
      console.log("🔄🔄🔄 [DRAG_OVER_MILESTONE] Over data:", event.over.data?.current);
    }
  };

  const enhancedHandleDragEnd = (event: any) => {
    console.log("🏁🏁🏁 [DRAG_END_MILESTONE] ===== DRAG END IN MILESTONE PROVIDER =====");
    console.log("🏁🏁🏁 [DRAG_END_MILESTONE] Active:", event.active.id);
    console.log("🏁🏁🏁 [DRAG_END_MILESTONE] Over:", event.over?.id || "NULL");
    
    handleDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={enhancedHandleDragEnd}
    >
      {children}
    </DndContext>
  );
};

export default MilestoneDragProvider;
