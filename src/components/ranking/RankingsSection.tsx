
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings,
  pendingRefinements = new Set(),
  availablePokemon = [],
  onManualReorder,
  onLocalReorder
}) => {
  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
  };

  return (
    <div className="flex flex-col h-full" style={{ overflow: 'visible', contain: 'none' }}>
      {/* Streamlined Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Rankings</h2>
          <div className="text-sm text-gray-500 font-medium">
            {displayRankings.length} Pokémon ranked
          </div>
        </div>
      </div>
      
      {/* Rankings Grid - REMOVED overflow-y-auto to prevent containment */}
      <div className="flex-1 p-4" style={{ overflow: 'visible', contain: 'none' }}>
        <DragDropGrid
          displayRankings={displayRankings}
          localPendingRefinements={pendingRefinements}
          pendingBattleCounts={new Map()}
          onMarkAsPending={handleMarkAsPending}
          onManualReorder={onManualReorder}
          onLocalReorder={onLocalReorder}
          availablePokemon={availablePokemon}
        />
      </div>
    </div>
  );
};
