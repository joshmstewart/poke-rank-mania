
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  pendingRefinements?: Set<number>;
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements = new Set()
}) => {
  console.log(`🔍 [RANKINGS_SECTION] Rendering with ${displayRankings.length} Pokemon`);
  
  const handleMarkAsPending = (pokemonId: number) => {
    console.log(`🔍 [RANKINGS_SECTION] Marking Pokemon ${pokemonId} as pending`);
    // For manual mode, we don't need special pending logic like battle mode
  };

  const handleLocalReorderWrapper = (newRankings: (Pokemon | RankedPokemon)[]) => {
    console.log(`🔍 [RANKINGS_SECTION] Local reorder with ${newRankings.length} Pokemon`);
    if (onLocalReorder) {
      onLocalReorder(newRankings);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Your Rankings</h2>
        <div className="text-sm">
          {displayRankings.length} Pokémon ranked
        </div>
      </div>
      
      {/* Rankings Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayRankings.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No Pokémon ranked yet</p>
              <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
            </div>
          </div>
        ) : (
          <DragDropGrid
            displayRankings={displayRankings}
            localPendingRefinements={pendingRefinements}
            pendingBattleCounts={new Map()}
            onManualReorder={onManualReorder || (() => {})}
            onLocalReorder={handleLocalReorderWrapper}
            onMarkAsPending={handleMarkAsPending}
          />
        )}
      </div>
    </div>
  );
};
