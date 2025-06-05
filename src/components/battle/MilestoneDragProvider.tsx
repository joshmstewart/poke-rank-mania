
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
};

export default MilestoneDragProvider;
