
import React from "react";
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSection } from "./RankingsSection";
import { EnhancedAvailablePokemonSection } from "./EnhancedAvailablePokemonSection";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import PokemonCard from "@/components/PokemonCard";

// Simple components to replace missing imports
const GenerationSelector = ({ selectedGeneration, onGenerationChange }: { 
  selectedGeneration: number; 
  onGenerationChange: (gen: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium">Generation:</label>
    <select 
      value={selectedGeneration} 
      onChange={(e) => onGenerationChange(Number(e.target.value))}
      className="px-3 py-1 border rounded"
    >
      <option value={0}>All Generations</option>
      {[1,2,3,4,5,6,7,8,9].map(gen => (
        <option key={gen} value={gen}>Gen {gen}</option>
      ))}
    </select>
  </div>
);

const BattleTypeToggle = ({ battleType, setBattleType }: {
  battleType: BattleType;
  setBattleType: (type: BattleType) => void;
}) => (
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium">Battle Type:</label>
    <select 
      value={battleType} 
      onChange={(e) => setBattleType(e.target.value as BattleType)}
      className="px-3 py-1 border rounded"
    >
      <option value="pairs">Pairs</option>
      <option value="triplets">Triplets</option>
    </select>
  </div>
);

interface EnhancedRankingLayoutProps {
  isLoading: boolean;
  availablePokemon: any[];
  enhancedAvailablePokemon: any[];
  displayRankings: any[];
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  battleType: BattleType;
  activeDraggedPokemon: any;
  filteredAvailablePokemon: any[];
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  onGenerationChange: (gen: number) => void;
  handleComprehensiveReset: () => void;
  setBattleType: React.Dispatch<React.SetStateAction<BattleType>>;
  handleDragStart: (event: any) => void;
  handleDragEnd: (event: any) => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  handleLocalReorder: (newRankings: any[]) => void;
}

export const EnhancedRankingLayout: React.FC<EnhancedRankingLayoutProps> = ({
  isLoading,
  availablePokemon,
  enhancedAvailablePokemon,
  displayRankings,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  battleType,
  activeDraggedPokemon,
  filteredAvailablePokemon,
  handlePageChange,
  getPageRange,
  onGenerationChange,
  handleComprehensiveReset,
  setBattleType,
  handleDragStart,
  handleDragEnd,
  handleManualReorder,
  handleLocalReorder
}) => {
  console.log(`🎨 [ENHANCED_LAYOUT] Rendering enhanced layout`);
  console.log(`🎨 [ENHANCED_LAYOUT] Enhanced available Pokemon: ${enhancedAvailablePokemon.length}`);
  console.log(`🎨 [ENHANCED_LAYOUT] Ranked Pokemon in enhanced: ${enhancedAvailablePokemon.filter(p => p.isRanked).length}`);

  // Create wrapper functions to match the expected signatures
  const handleManualReorderWrapper = (activeId: number, overId: number) => {
    // Find the indices of the active and over items
    const activeIndex = displayRankings.findIndex(p => p.id === activeId);
    const overIndex = displayRankings.findIndex(p => p.id === overId);
    
    if (activeIndex !== -1 && overIndex !== -1) {
      handleManualReorder(activeId, activeIndex, overIndex);
    }
  };

  const handleLocalReorderWrapper = (activeId: number, overId: number) => {
    // For local reorder, we could implement array reordering here if needed
    // For now, we'll use the same logic as manual reorder
    const activeIndex = displayRankings.findIndex(p => p.id === activeId);
    const overIndex = displayRankings.findIndex(p => p.id === overId);
    
    if (activeIndex !== -1 && overIndex !== -1) {
      // Create new rankings array with items moved
      const newRankings = [...displayRankings];
      const [removed] = newRankings.splice(activeIndex, 1);
      newRankings.splice(overIndex, 0, removed);
      handleLocalReorder(newRankings);
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Manual Pokemon Ranking</h1>
            <Button
              onClick={handleComprehensiveReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset Rankings
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <GenerationSelector
              selectedGeneration={selectedGeneration}
              onGenerationChange={onGenerationChange}
            />
            <BattleTypeToggle
              battleType={battleType}
              setBattleType={setBattleType}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Enhanced Available Pokemon Column */}
          <div className="w-1/2 border-r border-gray-200 bg-white">
            <EnhancedAvailablePokemonSection
              enhancedAvailablePokemon={enhancedAvailablePokemon}
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

          {/* Rankings Column */}
          <div className="w-1/2 bg-white">
            <SortableContext 
              items={displayRankings.map(p => p.id.toString())} 
              strategy={verticalListSortingStrategy}
            >
              <RankingsSection
                displayRankings={displayRankings}
                onManualReorder={handleManualReorderWrapper}
                onLocalReorder={handleLocalReorderWrapper}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
              />
            </SortableContext>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDraggedPokemon ? (
            <div className="transform rotate-3 scale-105 opacity-90">
              <PokemonCard
                pokemon={activeDraggedPokemon}
                compact={true}
                viewMode="grid"
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
