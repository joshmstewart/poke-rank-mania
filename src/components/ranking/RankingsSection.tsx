
import React, { useCallback, useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";
import { useDroppable } from '@dnd-kit/core';
import { useRenderTracker } from "@/hooks/battle/useRenderTracker";

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = React.memo(({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements = new Set(),
  availablePokemon = []
}) => {
  // Track renders for performance debugging
  useRenderTracker('RankingsSection', { 
    rankingsCount: displayRankings.length,
    hasManualReorder: !!onManualReorder 
  });

  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] ===== RENDERING RANKINGS SECTION =====`);
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Display rankings count: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Available Pokemon for collision: ${availablePokemon.length}`);
  
  // Memoize droppable configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-drop-zone',
    data: {
      type: 'rankings-container',
      accepts: 'available-pokemon'
    }
  }), []);

  const { setNodeRef, isOver } = useDroppable(droppableConfig);
  
  console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Droppable setup - ID: rankings-drop-zone, isOver: ${isOver}`);
  
  const handleMarkAsPending = useCallback((pokemonId: number) => {
    console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Marking Pokemon ${pokemonId} as pending`);
    // For manual mode, we don't need special pending logic like battle mode
  }, []);

  const handleLocalReorderWrapper = useCallback((newRankings: (Pokemon | RankedPokemon)[]) => {
    console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Local reorder with ${newRankings.length} Pokemon`);
    if (onLocalReorder) {
      onLocalReorder(newRankings);
    }
  }, [onLocalReorder]);

  // Memoize empty state content
  const emptyStateContent = useMemo(() => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <p className="text-lg mb-2">No Pokémon ranked yet</p>
        <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
        {isOver && (
          <p className="text-yellow-600 font-medium mt-2">Drop here to add to rankings!</p>
        )}
      </div>
    </div>
  ), [isOver]);

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
        {displayRankings.length === 0 ? emptyStateContent : (
          <DragDropGrid
            displayRankings={displayRankings}
            localPendingRefinements={pendingRefinements}
            pendingBattleCounts={new Map()}
            onManualReorder={onManualReorder || (() => {})}
            onLocalReorder={handleLocalReorderWrapper}
            onMarkAsPending={handleMarkAsPending}
            availablePokemon={availablePokemon}
          />
        )}
      </div>
    </div>
  );
});

RankingsSection.displayName = 'RankingsSection';
