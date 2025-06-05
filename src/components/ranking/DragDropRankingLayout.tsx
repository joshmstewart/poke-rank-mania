
import React, { useState } from 'react';
import { DndContext, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { AvailablePokemonSection } from './AvailablePokemonSection';
import { RankingsSection } from './RankingsSection';
import BattleControls from '@/components/battle/BattleControls';
import { BattleType } from '@/hooks/battle/types';
import { LoadingType } from '@/hooks/pokemon/types';

interface DragDropRankingLayoutProps {
  isLoading: boolean;
  availablePokemon: any[];
  displayRankings: any[];
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  battleType: BattleType;
  filteredAvailablePokemon: any[];
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  onGenerationChange: (gen: number) => void;
  handleComprehensiveReset: () => void;
  setBattleType: React.Dispatch<React.SetStateAction<BattleType>>;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  handleLocalReorder: (newRankings: any[]) => void;
}

export const DragDropRankingLayout: React.FC<DragDropRankingLayoutProps> = ({
  isLoading,
  availablePokemon,
  displayRankings,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  battleType,
  filteredAvailablePokemon,
  handlePageChange,
  getPageRange,
  onGenerationChange,
  handleComprehensiveReset,
  setBattleType,
  handleManualReorder,
  handleLocalReorder
}) => {
  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  // Handle drag end events
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      console.log('[DRAG_END] No drop target detected');
      return;
    }

    const draggedId = active.id;
    const droppedId = over.id;

    console.log(`[DRAG_END] Dragged: ${draggedId} -> Dropped on: ${droppedId}`);

    // Handle dropping available Pokemon on ranking slots
    if (typeof draggedId === 'string' && draggedId.startsWith('available-') && 
        typeof droppedId === 'string' && droppedId.startsWith('ranking-')) {
      
      const pokemonId = parseInt(draggedId.replace('available-', ''));
      const rankPosition = parseInt(droppedId.replace('ranking-', ''));
      
      console.log(`[DRAG_END] Adding Pokemon ${pokemonId} to rank ${rankPosition}`);
      
      // Use existing manual reorder logic
      handleManualReorder(pokemonId, -1, rankPosition);
    }
    
    // Handle reordering within rankings
    if (typeof draggedId === 'string' && draggedId.startsWith('ranking-') && 
        typeof droppedId === 'string' && droppedId.startsWith('ranking-')) {
      
      const sourcePokemon = displayRankings.find((_, index) => `ranking-${index}` === draggedId);
      const sourceIndex = displayRankings.findIndex((_, index) => `ranking-${index}` === draggedId);
      const targetIndex = parseInt(droppedId.replace('ranking-', ''));
      
      if (sourcePokemon && sourceIndex !== -1) {
        console.log(`[DRAG_END] Reordering Pokemon ${sourcePokemon.id} from ${sourceIndex} to ${targetIndex}`);
        handleManualReorder(sourcePokemon.id, sourceIndex, targetIndex);
      }
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-1">
        {/* Battle Controls Header */}
        <div className="max-w-7xl mx-auto mb-4">
          <BattleControls
            selectedGeneration={selectedGeneration}
            battleType={battleType}
            onGenerationChange={(gen) => onGenerationChange(Number(gen))}
            onBattleTypeChange={setBattleType}
            onRestartBattles={handleComprehensiveReset}
          />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-2" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* Left side - Available Pokemon (Draggable) */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <AvailablePokemonSection
                availablePokemon={filteredAvailablePokemon}
                isLoading={isLoading}
                selectedGeneration={selectedGeneration}
                loadingType={loadingType}
                currentPage={currentPage}
                totalPages={totalPages}
                loadingRef={loadingRef}
                handlePageChange={handlePageChange}
                getPageRange={getPageRange}
              />
            </div>
            
            {/* Right side - Rankings (Droppable) */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <RankingsSection 
                displayRankings={displayRankings}
                onManualReorder={handleManualReorder}
                onLocalReorder={handleLocalReorder}
                pendingRefinements={new Set()}
                availablePokemon={filteredAvailablePokemon}
              />
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};
