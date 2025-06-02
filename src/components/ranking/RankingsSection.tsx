
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";
import { useDroppable } from '@dnd-kit/core';

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  onManualReorder?: (activeId: number, overId: number) => void;
  onLocalReorder?: (activeId: number, overId: number) => void;
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements = new Set(),
  availablePokemon = []
}) => {
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] ===== RENDERING RANKINGS SECTION =====`);
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Display rankings count: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Available Pokemon for collision: ${availablePokemon.length}`);
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-drop-zone',
    data: {
      type: 'rankings-container',
      accepts: 'available-pokemon'
    }
  });
  
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Droppable setup - ID: rankings-drop-zone, isOver: ${isOver}`);
  
  const handleMarkAsPending = (pokemonId: number) => {
    console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Marking Pokemon ${pokemonId} as pending`);
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
      
      {/* Rankings Grid - Set up as drop zone with visual feedback */}
      <div 
        className={`flex-1 overflow-y-auto p-4 transition-colors ${
          isOver ? 'bg-yellow-50 border-2 border-dashed border-yellow-400' : ''
        }`} 
        ref={setNodeRef}
      >
        {displayRankings.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No Pokémon ranked yet</p>
              <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
              {isOver && (
                <p className="text-yellow-600 font-medium mt-2">Drop here to add to rankings!</p>
              )}
            </div>
          </div>
        ) : (
          <DragDropGrid
            displayRankings={displayRankings}
            localPendingRefinements={pendingRefinements}
            pendingBattleCounts={new Map()}
            onManualReorder={onManualReorder || (() => {})}
            onLocalReorder={onLocalReorder || (() => {})}
            onMarkAsPending={handleMarkAsPending}
            availablePokemon={availablePokemon}
          />
        )}
      </div>
    </div>
  );
};
