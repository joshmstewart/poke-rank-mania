
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";
import { useDroppable } from '@dnd-kit/core';

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
  // Remove the useDroppable from here since DragDropGrid handles its own drop zone
  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
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
      
      {/* Rankings Grid - Let DragDropGrid handle its own drop zone */}
      <div className="flex-1 overflow-y-auto p-4">
        <DragDropGrid
          displayRankings={displayRankings}
          localPendingRefinements={pendingRefinements}
          pendingBattleCounts={new Map()}
          onMarkAsPending={handleMarkAsPending}
          availablePokemon={availablePokemon}
        />
      </div>
    </div>
  );
};
