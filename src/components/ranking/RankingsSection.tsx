
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings,
  pendingRefinements = new Set(),
  availablePokemon = []
}) => {
  const { setNodeRef } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
    }
  });

  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
  };

  // Create sortable items array with string IDs
  const sortableItems = displayRankings.map(pokemon => pokemon.id.toString());

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
      
      {/* Rankings Grid - The entire scrollable area is now a drop zone with SortableContext */}
      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          <DragDropGrid
            displayRankings={displayRankings}
            localPendingRefinements={pendingRefinements}
            pendingBattleCounts={new Map()}
            onMarkAsPending={handleMarkAsPending}
            availablePokemon={availablePokemon}
          />
        </SortableContext>
      </div>
    </div>
  );
};
