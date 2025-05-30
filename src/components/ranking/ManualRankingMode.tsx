
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDragAndDropSensors } from "@/hooks/battle/useDragAndDropSensors";
import RankedPokemonList from "./RankedPokemonList";
import UnrankedPokemonList from "./UnrankedPokemonList";

interface ManualRankingModeProps {
  rankedPokemon: RankedPokemon[];
  unrankedPokemon: Pokemon[];
  onAddPokemonToRankings: (pokemon: Pokemon, targetIndex: number) => void;
  onReorderPokemon: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
}

const ManualRankingMode: React.FC<ManualRankingModeProps> = ({
  rankedPokemon,
  unrankedPokemon,
  onAddPokemonToRankings,
  onReorderPokemon,
  pendingRefinements = new Set()
}) => {
  console.log(`🎯 [MANUAL_MODE] ===== MANUAL RANKING MODE RENDER =====`);
  console.log(`🎯 [MANUAL_MODE] Ranked Pokemon: ${rankedPokemon.length}`);
  console.log(`🎯 [MANUAL_MODE] Unranked Pokemon: ${unrankedPokemon.length}`);

  const sensors = useDragAndDropSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log(`🎯 [MANUAL_MODE] Drag cancelled or no change`);
      return;
    }

    const draggedId = Number(active.id);
    const draggedPokemon = [...rankedPokemon, ...unrankedPokemon].find(p => p.id === draggedId);
    
    if (!draggedPokemon) {
      console.error(`🎯 [MANUAL_MODE] Dragged Pokemon ${draggedId} not found`);
      return;
    }

    console.log(`🎯 [MANUAL_MODE] Processing drag: ${draggedPokemon.name} (${draggedId})`);

    // Check if dragging from unranked to ranked
    const isFromUnranked = unrankedPokemon.some(p => p.id === draggedId);
    const isToRanked = over.id.toString().startsWith('ranked-');

    if (isFromUnranked && isToRanked) {
      // Adding new Pokemon to rankings
      const targetIndex = parseInt(over.id.toString().replace('ranked-', ''));
      console.log(`🎯 [MANUAL_MODE] Adding ${draggedPokemon.name} to rankings at index ${targetIndex}`);
      onAddPokemonToRankings(draggedPokemon, targetIndex);
    } else if (!isFromUnranked && isToRanked) {
      // Reordering within ranked list
      const sourceIndex = rankedPokemon.findIndex(p => p.id === draggedId);
      const targetIndex = parseInt(over.id.toString().replace('ranked-', ''));
      
      if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
        console.log(`🎯 [MANUAL_MODE] Reordering ${draggedPokemon.name} from ${sourceIndex} to ${targetIndex}`);
        onReorderPokemon(draggedId, sourceIndex, targetIndex);
      }
    }
  };

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Manual Ranking Mode</h2>
        <p className="text-gray-600">
          Drag Pokemon from the unranked list to add them to your rankings, or reorder Pokemon within your ranked list.
          Rankings are powered by TrueSkill and shared across all modes.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Unranked Pokemon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Unranked Pokemon ({unrankedPokemon.length})</h3>
            <UnrankedPokemonList 
              unrankedPokemon={unrankedPokemon}
            />
          </div>

          {/* Right Panel - Ranked Pokemon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Rankings ({rankedPokemon.length})</h3>
            <SortableContext 
              items={rankedPokemon.map((p, idx) => `ranked-${idx}`)}
              strategy={verticalListSortingStrategy}
            >
              <RankedPokemonList 
                rankedPokemon={rankedPokemon}
                pendingRefinements={pendingRefinements}
              />
            </SortableContext>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default ManualRankingMode;
